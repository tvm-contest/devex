package sqlite3

import (
	"context"
	"database/sql"
	"encoding/json"
	"fmt"
	"sync"
	"time"

	sq "github.com/Masterminds/squirrel"
	"golang.org/x/sync/errgroup"

	"ton-http-notification-provider/storage"

	"ton-http-notification-provider/jobpool"

	"github.com/cenkalti/backoff"
)

// IsNotFound returns true if the given error indicates that a record
// could not be found.
func IsNotFound(err error) bool {
	return err == sql.ErrNoRows
}

// IsDeadlock returns true if the given error indicates that we
// found a deadlock.
func IsDeadlock(err error) bool {
	return err.Error() == "database is locked"
}

// Run runs fn with the given database connection.
// Run recovers from panics, e.g. in fn.
func Run(ctx context.Context, db *sql.DB, fn func(context.Context) error) (err error) {
	defer func() {
		if rerr := recover(); rerr != nil {
			err = fmt.Errorf("%v", rerr)
		}
	}()
	return fn(ctx)
}

func RunWithRetry(ctx context.Context, db *sql.DB, fn func(context.Context) error, retryable func(error) bool) (err error) {
	return RunWithRetryBackoff(
		ctx,
		db,
		fn,
		retryable,
		backoff.NewExponentialBackOff(), // use defaults
	)
}

// RunWithRetryBackoff is like RunWithRetry but with configurable backoff.
func RunWithRetryBackoff(ctx context.Context, db *sql.DB, fn func(context.Context) error, retryable func(error) bool, b backoff.BackOff) (err error) {
	b.Reset()
	for {
		if err = Run(ctx, db, fn); err == nil {
			return nil
		}
		if retryable != nil && !retryable(err) {
			return err
		}
		delay := b.NextBackOff()
		if delay == backoff.Stop {
			return err
		}
		time.Sleep(delay)
	}
}

// RunInTx runs fn in a database transaction.
// The context ctx is passed to fn, as well as the newly created
// transaction. If fn fails, it is repeated several times before
// giving up, with exponential backoff.
//
// There are a few rules that fn must respect:
//
// 1. fn must use the passed tx reference for all database calls.
// 2. fn must not commit or rollback the transaction: Run will do that.
// 3. fn must be idempotent, i.e. it may be called several times
//    without side effects.
//
// If fn returns nil, RunInTx commits the transaction, returning
// the Commit and a nil error if it succeeds.
//
// If fn returns a non-nil value, RunInTx rolls back the
// transaction and will return the reported error from fn.
//
// RunInTx also recovers from panics, e.g. in fn.
func RunInTx(ctx context.Context, db *sql.DB, fn func(context.Context, *sql.Tx) error) (err error) {
	tx, err := db.Begin()
	if err != nil {
		return err
	}
	defer func() {
		if rerr := recover(); rerr != nil {
			err = fmt.Errorf("%v", rerr)
			_ = tx.Rollback()
		}
	}()
	if err = fn(ctx, tx); err != nil {
		_ = tx.Rollback()
		return err
	}
	err = tx.Commit()
	return err
}

// RunInTxWithRetry is like RunInTx but will retry
// several times with exponential backoff. In that case, fn must also
// be idempotent, i.e. it may be called several times without side effects.
func RunInTxWithRetry(ctx context.Context, db *sql.DB, fn func(context.Context, *sql.Tx) error, retryable func(error) bool) (err error) {
	return RunInTxWithRetryBackoff(
		ctx,
		db,
		fn,
		retryable,
		backoff.NewExponentialBackOff(), // use defaults
	)
}

// RunInTxWithRetryBackoff is like RunInTxWithRetry but with configurable
// backoff.
func RunInTxWithRetryBackoff(ctx context.Context, db *sql.DB, fn func(context.Context, *sql.Tx) error, retryable func(error) bool, b backoff.BackOff) (err error) {
	b.Reset()
	for {
		if err = RunInTx(ctx, db, fn); err == nil {
			return nil
		}
		if retryable != nil && !retryable(err) {
			return err
		}
		delay := b.NextBackOff()
		if delay == backoff.Stop {
			return err
		}
		time.Sleep(delay)
	}
}

const (
	sqlite3Schema = `
	CREATE TABLE IF NOT EXISTS jobqueue_jobs (
								id VARCHAR(36) primary key,
								topic VARCHAR(255),
								state VARCHAR(30),
								args TEXT,
								rank INT,
								priority INT,
								retry INT,
								retry_wait INT,
								retry_backoff VARCHAR(255),
								max_retry INT,
								correlation_id VARCHAR(255),
								correlation_group VARCHAR(255),
								after INT,
								created INT,
								started INT,
								completed INT,
								last_mod INT
							);
	CREATE INDEX IF NOT EXISTS ix_jobs_topic ON jobqueue_jobs(topic);
	CREATE INDEX IF NOT EXISTS ix_jobs_state ON jobqueue_jobs(state);
	CREATE INDEX IF NOT EXISTS ix_jobs_rank ON jobqueue_jobs(rank);
	CREATE INDEX IF NOT EXISTS ix_jobs_priority ON jobqueue_jobs(priority);
	CREATE INDEX IF NOT EXISTS ix_jobs_correlation_id ON jobqueue_jobs(correlation_id);
	CREATE INDEX IF NOT EXISTS ix_jobs_correlation_group ON jobqueue_jobs(correlation_group);
	CREATE INDEX IF NOT EXISTS ix_jobs_after ON jobqueue_jobs(after);
	CREATE INDEX IF NOT EXISTS ix_jobs_created ON jobqueue_jobs(created);
	CREATE INDEX IF NOT EXISTS ix_jobs_started ON jobqueue_jobs(started);
	CREATE INDEX IF NOT EXISTS ix_jobs_completed ON jobqueue_jobs(completed);
	CREATE INDEX IF NOT EXISTS ix_jobs_last_mod ON jobqueue_jobs(last_mod);`
)

// Store represents a persistent MySQL storage implementation.
// It implements the jobqueue.Store interface.
type Store struct {
	db    *sql.DB
	debug bool

	stmtOnce           sync.Once
	createStmt         *sql.Stmt
	updateStmt         *sql.Stmt
	deleteStmt         *sql.Stmt
	nextStmt           *sql.Stmt
	lookupStmt         *sql.Stmt
	lookupByCorrIDStmt *sql.Stmt
}

// StoreOption is an options provider for Store.
type StoreOption func(*Store)

// NewStore initializes a new sqlite3 storage.
func NewStore(d *storage.Database, options ...StoreOption) (*Store, error) {
	st := &Store{}
	for _, opt := range options {
		opt(st)
	}

	// Now connect again, this time with the db name
	st.db = d.Db

	// Create schema
	_, err := st.db.Exec(sqlite3Schema)
	if err != nil {
		return nil, err
	}

	return st, nil
}

// SetDebug indicates whether to enable or disable debugging (which will
// output SQL to the console).
func SetDebug(enabled bool) StoreOption {
	return func(s *Store) {
		s.debug = enabled
	}
}

func (s *Store) initStmt() {
	var err error

	// Create statement
	s.createStmt, err = s.db.Prepare("INSERT INTO jobqueue_jobs (id,topic,state,args,rank,priority,retry,retry_wait,retry_backoff,max_retry,correlation_group,correlation_id,after,created,started,completed,last_mod) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?,?)")
	if err != nil {
		panic(err)
	}

	// Update statement
	s.updateStmt, err = s.db.Prepare("UPDATE jobqueue_jobs SET topic=?,state=?,args=?,rank=?,priority=?,retry=?,retry_wait=?,retry_backoff=?,max_retry=?,correlation_group=?,correlation_id=?,after=?,created=?,started=?,completed=?,last_mod=? WHERE id=?")
	if err != nil {
		panic(err)
	}

	// Delete statement
	s.deleteStmt, err = s.db.Prepare("DELETE FROM jobqueue_jobs WHERE id=?")
	if err != nil {
		panic(err)
	}

	// Next statement
	s.nextStmt, err = s.db.Prepare("SELECT id,topic,state,args,rank,priority,retry,retry_wait,retry_backoff,max_retry,correlation_group,correlation_id,after,created,started,completed,last_mod FROM jobqueue_jobs WHERE state=? AND after<=? ORDER BY rank DESC, priority DESC LIMIT 1")
	if err != nil {
		panic(err)
	}

	// Lookup (by id) statement
	s.lookupStmt, err = s.db.Prepare("SELECT id,topic,state,args,rank,priority,retry,retry_wait,retry_backoff,max_retry,correlation_group,correlation_id,after,created,started,completed,last_mod FROM jobqueue_jobs WHERE id=? LIMIT 1")
	if err != nil {
		panic(err)
	}

	// Lookup by correlation id
	s.lookupByCorrIDStmt, err = s.db.Prepare("SELECT id,topic,state,args,rank,priority,retry,retry_wait,retry_backoff,max_retry,correlation_group,correlation_id,after,created,started,completed,last_mod FROM jobqueue_jobs WHERE correlation_id=? LIMIT 1")
	if err != nil {
		panic(err)
	}
}

func (s *Store) wrapError(err error) error {
	if IsNotFound(err) {
		// Map specific errors to jobqueue-specific "not found" error
		return jobpool.ErrNotFound
	}
	return err
}

// Start is called when the manager starts up.
// We ensure that stale jobs are marked as failed so that we have place
// for new jobs.
func (s *Store) Start(b jobpool.StartupBehaviour) error {
	s.stmtOnce.Do(s.initStmt)

	if b != jobpool.None {
		ctx := context.Background()
		state := b
		err := RunInTxWithRetry(ctx, s.db, func(ctx context.Context, tx *sql.Tx) error {
			_, err := tx.ExecContext(
				ctx,
				`UPDATE jobqueue_jobs SET state = ?, completed = ? WHERE state = ?`,
				state,
				time.Now().UnixNano(),
				jobpool.Working,
			)
			if err != nil {
				return err
			}
			return nil
		}, func(err error) bool {
			return IsDeadlock(err)
		})
		if err != nil {
			return s.wrapError(err)
		}
	}

	return nil
}

// Create adds a new job to the store.
func (s *Store) Create(ctx context.Context, job *jobpool.Job) error {
	s.stmtOnce.Do(s.initStmt)

	j, err := newJob(job)
	if err != nil {
		return err
	}
	j.LastMod = j.Created

	err = RunInTxWithRetry(ctx, s.db, func(ctx context.Context, tx *sql.Tx) error {
		res, err := tx.Stmt(s.createStmt).ExecContext(
			ctx,
			j.ID,
			j.Topic,
			j.State,
			j.Args,
			j.Rank,
			j.Priority,
			j.Retry,
			j.RetryWait,
			j.RetryBackoff,
			j.MaxRetry,
			j.CorrelationGroup,
			j.CorrelationID,
			j.After,
			j.Created,
			j.Started,
			j.Completed,
			j.LastMod,
		)
		if err != nil {
			return err
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected != 1 {
			return err
		}
		return nil
	}, func(err error) bool {
		return IsDeadlock(err)
	})
	return s.wrapError(err)
}

// Update updates the job in the store.
func (s *Store) Update(ctx context.Context, job *jobpool.Job) error {
	s.stmtOnce.Do(s.initStmt)

	j, err := newJob(job)
	if err != nil {
		return err
	}

	err = RunInTxWithRetry(ctx, s.db, func(ctx context.Context, tx *sql.Tx) error {
		var id string
		err := tx.QueryRowContext(
			ctx,
			`SELECT id FROM jobqueue_jobs WHERE id = ? AND last_mod = ?`,
			job.ID,
			job.Updated,
		).Scan(&id)
		if err != nil {
			return err
		}
		j.LastMod = time.Now().UnixNano()
		res, err := tx.Stmt(s.updateStmt).ExecContext(
			ctx,
			j.Topic,
			j.State,
			j.Args,
			j.Rank,
			j.Priority,
			j.Retry,
			j.RetryWait,
			j.RetryBackoff,
			j.MaxRetry,
			j.CorrelationGroup,
			j.CorrelationID,
			j.After,
			j.Created,
			j.Started,
			j.Completed,
			j.LastMod,
			j.ID,
		)
		if err != nil {
			return err
		}
		rowsAffected, err := res.RowsAffected()
		if err != nil {
			return err
		}
		if rowsAffected != 1 {
			return err
		}
		job.Updated = j.LastMod
		return nil
	}, func(err error) bool {
		return IsDeadlock(err)
	})
	return s.wrapError(err)
}

// Next picks the next job to execute, or nil if no executable job is available.
func (s *Store) Next() (*jobpool.Job, error) {
	s.stmtOnce.Do(s.initStmt)

	var j Job
	ctx := context.Background()
	err := RunWithRetry(ctx, s.db, func(ctx context.Context) error {
		err := s.nextStmt.QueryRowContext(ctx, jobpool.Waiting, time.Now().UnixNano()).Scan(
			&j.ID,
			&j.Topic,
			&j.State,
			&j.Args,
			&j.Rank,
			&j.Priority,
			&j.Retry,
			&j.RetryWait,
			&j.RetryBackoff,
			&j.MaxRetry,
			&j.CorrelationGroup,
			&j.CorrelationID,
			&j.After,
			&j.Created,
			&j.Started,
			&j.Completed,
			&j.LastMod,
		)
		if err != nil {
			return err
		}
		return nil
	}, func(err error) bool {
		return IsDeadlock(err)
	})
	if IsNotFound(err) {
		return nil, jobpool.ErrNotFound
	}
	if err != nil {
		return nil, s.wrapError(err)
	}
	return j.ToJob()
}

// Delete removes a job from the store.
func (s *Store) Delete(ctx context.Context, job *jobpool.Job) error {
	s.stmtOnce.Do(s.initStmt)

	err := RunInTxWithRetry(ctx, s.db, func(ctx context.Context, tx *sql.Tx) error {
		_, err := tx.Stmt(s.deleteStmt).ExecContext(ctx, job.ID)
		switch {
		case err == sql.ErrNoRows:
			return nil
		default:
			return err
		}
	}, func(err error) bool {
		return IsDeadlock(err)
	})
	return s.wrapError(err)
}

// Lookup retrieves a single job in the store by its identifier.
func (s *Store) Lookup(ctx context.Context, id string) (*jobpool.Job, error) {
	s.stmtOnce.Do(s.initStmt)

	var j Job
	err := RunWithRetry(ctx, s.db, func(ctx context.Context) error {
		err := s.lookupStmt.QueryRowContext(ctx, id).Scan(
			&j.ID,
			&j.Topic,
			&j.State,
			&j.Args,
			&j.Rank,
			&j.Priority,
			&j.Retry,
			&j.RetryWait,
			&j.RetryBackoff,
			&j.MaxRetry,
			&j.CorrelationGroup,
			&j.CorrelationID,
			&j.After,
			&j.Created,
			&j.Started,
			&j.Completed,
			&j.LastMod,
		)
		if err != nil {
			return err
		}
		return nil

	}, func(err error) bool {
		return IsDeadlock(err)
	})
	if err != nil {
		return nil, s.wrapError(err)
	}
	return j.ToJob()
}

// LookupByCorrelationID returns the details of jobs by their correlation identifier.
// If no such job could be found, an empty array is returned.
func (s *Store) LookupByCorrelationID(ctx context.Context, correlationID string) ([]*jobpool.Job, error) {
	s.stmtOnce.Do(s.initStmt)

	var jobs []Job
	err := RunWithRetry(ctx, s.db, func(ctx context.Context) error {
		rows, err := s.lookupByCorrIDStmt.QueryContext(ctx, correlationID)
		if err != nil {
			return err
		}
		defer rows.Close()
		for rows.Next() {
			var j Job
			err := rows.Scan(
				&j.ID,
				&j.Topic,
				&j.State,
				&j.Args,
				&j.Rank,
				&j.Priority,
				&j.Retry,
				&j.RetryWait,
				&j.RetryBackoff,
				&j.MaxRetry,
				&j.CorrelationGroup,
				&j.CorrelationID,
				&j.After,
				&j.Created,
				&j.Started,
				&j.Completed,
				&j.LastMod,
			)
			if err != nil {
				return err
			}
			jobs = append(jobs, j)
		}
		if err := rows.Err(); err != nil {
			return err
		}
		return nil

	}, func(err error) bool {
		return IsDeadlock(err)
	})
	if err != nil {
		return nil, s.wrapError(err)
	}
	result := make([]*jobpool.Job, len(jobs))
	for i, j := range jobs {
		job, err := j.ToJob()
		if err != nil {
			return nil, s.wrapError(err)
		}
		result[i] = job
	}
	return result, nil
}

// List returns a list of all jobs stored in the data store.
func (s *Store) List(ctx context.Context, request *jobpool.ListRequest) (*jobpool.ListResponse, error) {
	s.stmtOnce.Do(s.initStmt)

	resp := &jobpool.ListResponse{}

	columns := "id,topic,state,args,rank,priority,retry,retry_wait,retry_backoff,max_retry,correlation_group,correlation_id,after,created,started,completed,last_mod"
	where := make(map[string]interface{})
	countBuilder := sq.Select("COUNT(*)").From("jobqueue_jobs")
	queryBuilder := sq.Select(columns).From("jobqueue_jobs")

	// Filters
	if v := request.Topic; v != "" {
		where["topic"] = v
	}
	if v := request.State; v != "" {
		where["state"] = v
	}
	if v := request.CorrelationGroup; v != "" {
		where["correlation_group"] = v
	}
	if v := request.CorrelationID; v != "" {
		where["correlation_id"] = v
	}

	// Count
	countBuilder = sq.Select("COUNT(*)").From("jobqueue_jobs").Where(where)
	{
		sql, args, err := countBuilder.ToSql()
		if err != nil {
			return nil, s.wrapError(err)
		}
		err = s.db.QueryRowContext(ctx, sql, args...).Scan(
			&resp.Total,
		)
		if err != nil {
			return nil, s.wrapError(err)
		}
	}

	// Iterate
	queryBuilder = sq.Select(columns).
		From("jobqueue_jobs").
		Where(where).
		OrderBy("last_mod DESC").
		Offset(uint64(request.Offset)).Limit(uint64(request.Limit))
	{
		sql, args, err := queryBuilder.ToSql()
		if err != nil {
			return nil, s.wrapError(err)
		}
		rows, err := s.db.QueryContext(ctx, sql, args...)
		if err != nil {
			return nil, s.wrapError(err)
		}
		defer rows.Close()
		for rows.Next() {
			var j Job
			err := rows.Scan(
				&j.ID,
				&j.Topic,
				&j.State,
				&j.Args,
				&j.Rank,
				&j.Priority,
				&j.Retry,
				&j.RetryWait,
				&j.RetryBackoff,
				&j.MaxRetry,
				&j.CorrelationGroup,
				&j.CorrelationID,
				&j.After,
				&j.Created,
				&j.Started,
				&j.Completed,
				&j.LastMod,
			)
			if err != nil {
				return nil, s.wrapError(err)
			}
			job, err := j.ToJob()
			if err != nil {
				return nil, s.wrapError(err)
			}
			resp.Jobs = append(resp.Jobs, job)
		}
		if err := rows.Err(); err != nil {
			return nil, s.wrapError(err)
		}
	}

	return resp, nil
}

// Stats returns statistics about the jobs in the store.
func (s *Store) Stats(ctx context.Context, req *jobpool.StatsRequest) (*jobpool.Stats, error) {
	s.stmtOnce.Do(s.initStmt)

	stats := new(jobpool.Stats)
	g, ctx := errgroup.WithContext(ctx)

	// Waiting
	g.Go(func() error {
		where := map[string]interface{}{
			"state": jobpool.Waiting,
		}
		if v := req.Topic; v != "" {
			where["topic"] = v
		}
		if v := req.CorrelationGroup; v != "" {
			where["correlation_group"] = v
		}
		sql, args, err := sq.Select("COUNT(*)").From("jobqueue_jobs").Where(where).ToSql()
		if err != nil {
			return err
		}
		return s.db.QueryRowContext(ctx, sql, args...).Scan(&stats.Waiting)
	})

	// Working
	g.Go(func() error {
		where := map[string]interface{}{
			"state": jobpool.Working,
		}
		if v := req.Topic; v != "" {
			where["topic"] = v
		}
		if v := req.CorrelationGroup; v != "" {
			where["correlation_group"] = v
		}
		sql, args, err := sq.Select("COUNT(*)").From("jobqueue_jobs").Where(where).ToSql()
		if err != nil {
			return err
		}
		return s.db.QueryRowContext(ctx, sql, args...).Scan(&stats.Working)
	})

	// Succeeded
	g.Go(func() error {
		where := map[string]interface{}{
			"state": jobpool.Succeeded,
		}
		if v := req.Topic; v != "" {
			where["topic"] = v
		}
		if v := req.CorrelationGroup; v != "" {
			where["correlation_group"] = v
		}
		sql, args, err := sq.Select("COUNT(*)").From("jobqueue_jobs").Where(where).ToSql()
		if err != nil {
			return err
		}
		return s.db.QueryRowContext(ctx, sql, args...).Scan(&stats.Succeeded)
	})

	// Failed
	g.Go(func() error {
		where := map[string]interface{}{
			"state": jobpool.Failed,
		}
		if v := req.Topic; v != "" {
			where["topic"] = v
		}
		if v := req.CorrelationGroup; v != "" {
			where["correlation_group"] = v
		}
		sql, args, err := sq.Select("COUNT(*)").From("jobqueue_jobs").Where(where).ToSql()
		if err != nil {
			return err
		}
		return s.db.QueryRowContext(ctx, sql, args...).Scan(&stats.Failed)
	})

	if err := g.Wait(); err != nil {
		return nil, s.wrapError(err)
	}
	return stats, nil
}

// -- sqlite3-internal representation of a task --

type Job struct {
	ID               string
	Topic            string
	State            string
	Args             sql.NullString
	Rank             int
	Priority         int64
	Retry            int
	RetryWait        int64
	RetryBackoff     string
	MaxRetry         int
	CorrelationGroup sql.NullString
	CorrelationID    sql.NullString
	After            int64
	Created          int64
	Started          int64
	Completed        int64
	LastMod          int64
}

func newJob(job *jobpool.Job) (*Job, error) {
	var args string
	if job.Args != nil {
		v, err := json.Marshal(job.Args)
		if err != nil {
			return nil, err
		}
		args = string(v)
	}
	return &Job{
		ID:               job.ID,
		Topic:            job.Topic,
		State:            job.State,
		Args:             sql.NullString{String: args, Valid: args != ""},
		Rank:             job.Rank,
		Priority:         job.Priority,
		Retry:            job.Retry,
		RetryWait:        job.RetryWait,
		RetryBackoff:     job.RetryBackoff,
		MaxRetry:         job.MaxRetry,
		CorrelationGroup: sql.NullString{String: job.CorrelationGroup, Valid: job.CorrelationGroup != ""},
		CorrelationID:    sql.NullString{String: job.CorrelationID, Valid: job.CorrelationID != ""},
		After:            job.After,
		Created:          job.Created,
		LastMod:          job.Updated,
		Started:          job.Started,
		Completed:        job.Completed,
	}, nil
}

func (j *Job) ToJob() (*jobpool.Job, error) {
	var args []interface{}
	if j.Args.Valid && j.Args.String != "" {
		if err := json.Unmarshal([]byte(j.Args.String), &args); err != nil {
			return nil, err
		}
	}
	job := &jobpool.Job{
		ID:               j.ID,
		Topic:            j.Topic,
		State:            j.State,
		Args:             args,
		Rank:             j.Rank,
		Priority:         j.Priority,
		Retry:            j.Retry,
		RetryWait:        j.RetryWait,
		RetryBackoff:     j.RetryBackoff,
		MaxRetry:         j.MaxRetry,
		CorrelationGroup: j.CorrelationGroup.String,
		CorrelationID:    j.CorrelationID.String,
		After:            j.After,
		Created:          j.Created,
		Started:          j.Started,
		Updated:          j.LastMod,
		Completed:        j.Completed,
	}
	return job, nil
}
