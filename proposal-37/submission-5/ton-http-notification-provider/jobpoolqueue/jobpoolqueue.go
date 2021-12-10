package jobpoolqueue

import (
	"errors"
	"fmt"
	"io"
	"net"
	"net/http"
	"net/url"
	"strings"
	"time"
	"ton-http-notification-provider/async"
	"ton-http-notification-provider/jobpool"
	"ton-http-notification-provider/jobpool/sqlite3"
	"ton-http-notification-provider/storage"
)

func StartQueue(baseContext storage.Context) *jobpool.Manager {
	// Create a sqlite3-based persistent backend.
	store, err := sqlite3.NewStore(baseContext.Database)
	if err != nil {
		panic(err)
	}

	// Create a manager with the MySQL store and 10 concurrent workers.
	m := jobpool.New(
		jobpool.SetStore(store),
		jobpool.SetConcurrency(1, 10),
		jobpool.SetStartupBehaviour(jobpool.MarkAsWaiting),
	)

	// Register one or more topics and their processor
	err = m.Register("CheckDNS", func(job *jobpool.Job) error {
		Id, _ := job.Args[0].(string)
		Url, _ := job.Args[1].(string)
		TXTvalue, _ := job.Args[2].(string)

		// Need to check that maybe confirmed already
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT confirmed FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		var confirmed int
		for requestResult.Next() {
			requestResult.Scan(&confirmed)
		}
		requestResult.Close()

		if confirmed == 1 {
			return nil
		}

		parsedUrl, err := url.Parse(Url)
		if err != nil {
			println(fmt.Println(err.Error()))
			return err
		}

		host, _, _ := net.SplitHostPort(parsedUrl.Host)

		records, err := net.LookupTXT(host)

		if err != nil {
			println(fmt.Println(err.Error()))
			return err
		}

		verified := false
		for _, value := range records {
			if TXTvalue == value {
				verified = true
				break
			}
		}

		if !verified {
			return errors.New("no TXT record")
		}

		println(fmt.Printf("id %s is verified", Id))

		future := async.Exec(func() (out interface{}, err error) {
			return DoAsyncUpdateConfirmed(baseContext, Id)
		})

		_, errorAwait := future.Await()

		if errorAwait != nil {
			return errorAwait
		}

		//update db that ok
		return nil
	})

	if err != nil {
		panic(err)
	}

	err = m.Register("CheckMetatag", func(job *jobpool.Job) error {
		Id, _ := job.Args[0].(string)
		Url, _ := job.Args[1].(string)
		MetatagValue, _ := job.Args[2].(string)

		// Need to check that maybe confirmed already
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT confirmed FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		var confirmed int
		for requestResult.Next() {
			requestResult.Scan(&confirmed)
		}
		requestResult.Close()

		if confirmed == 1 {
			return nil
		}

		resp, err := http.Get(Url)

		if err != nil {
			return err
		}

		if resp.StatusCode != http.StatusOK {
			return errors.New("status not OK")
		}

		body, err := io.ReadAll(resp.Body)
		if err != nil {
			return errors.New("can't read body")
		}

		resp.Body.Close()

		if !strings.Contains(string(body), "<meta name=\"nph-mtw\" content=\""+MetatagValue+"\">") {
			return errors.New("can't find metatag")
		}

		println(fmt.Printf("id %s is verified", Id))

		future := async.Exec(func() (out interface{}, err error) {
			return DoAsyncUpdateConfirmed(baseContext, Id)
		})

		_, errorAwait := future.Await()

		if errorAwait != nil {
			return errorAwait
		}

		//update db that ok
		return nil
	})

	if err != nil {
		panic(err)
	}

	err = m.Register("CheckFile", func(job *jobpool.Job) error {
		Id, _ := job.Args[0].(string)
		Url, _ := job.Args[1].(string)
		FileName, _ := job.Args[2].(string)

		// Need to check that maybe confirmed already
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT confirmed FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		var confirmed int
		for requestResult.Next() {
			requestResult.Scan(&confirmed)
		}
		requestResult.Close()

		if confirmed == 1 {
			return nil
		}

		resp, err := http.Get(Url + "/" + FileName + ".html")

		StatusCode := resp.StatusCode

		resp.Body.Close()

		if err != nil {
			return err
		}

		if StatusCode != http.StatusOK {
			return errors.New("status not OK")
		}

		println(fmt.Printf("id %s is verified", Id))

		future := async.Exec(func() (out interface{}, err error) {
			return DoAsyncUpdateConfirmed(baseContext, Id)
		})

		_, errorAwait := future.Await()

		if errorAwait != nil {
			return errorAwait
		}

		//update db that ok
		return nil
	})

	if err != nil {
		panic(err)
	}

	err = m.Register("SendMessage", func(job *jobpool.Job) error {
		Id, _ := job.Args[0].(string)
		Nonce, _ := job.Args[1].(string)
		Message, _ := job.Args[2].(string)

		println(fmt.Printf("Id %s, Nonce %s, Message %s", Id, Nonce, Message))

		// Need to check that maybe confirmed already
		requestResult, errRequest := baseContext.Database.Db.Query(`SELECT  id, 
																			confirmed,
																			url as callbackUrl,
																			method,
																			query,
																			counter
																	FROM callbackurl
																	WHERE id = ?`, Id)
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		id := 0 // will be 0 if no result from db
		var confirmed, counter int
		var callbackUrl, method, query string
		for requestResult.Next() {
			requestResult.Scan(&id, &confirmed, &callbackUrl, &method, &query, &counter)
		}

		requestResult.Close()

		if id == 0 || confirmed == 0 {
			return errors.New("rights on the callback URI is not confirmed")
		}

		if method == "POST" || method == "PUT" || method == "PATCH" {
			client := &http.Client{}

			data := url.Values{}
			data.Set(query, Nonce+" "+Message)

			req, err := http.NewRequest(method, callbackUrl, strings.NewReader(data.Encode()))
			req.Header.Set("Content-Type", fmt.Sprintf("application/x-www-form-urlencoded; %s=value", query))

			if err != nil {
				return fmt.Errorf("we can't build new request for URL %s", callbackUrl)
			}

			resp, err := client.Do(req)
			if err != nil {
				return err
			}

			if resp.StatusCode != http.StatusOK &&
				resp.StatusCode != http.StatusCreated &&
				resp.StatusCode != http.StatusAccepted &&
				resp.StatusCode != http.StatusNonAuthoritativeInfo &&
				resp.StatusCode != http.StatusNoContent &&
				resp.StatusCode != http.StatusResetContent &&
				resp.StatusCode != http.StatusPartialContent &&
				resp.StatusCode != http.StatusMultiStatus &&
				resp.StatusCode != http.StatusAlreadyReported &&
				resp.StatusCode != http.StatusIMUsed {
				return errors.New("status not OK")
			}

			resp.Body.Close()
		}

		if method == "GET" {
			client := &http.Client{}

			req, err := http.NewRequest("GET", callbackUrl, nil)
			if err != nil {
				return fmt.Errorf("we can't build new request for URL %s", callbackUrl)
			}

			req.URL.Query()

			q := req.URL.Query()
			q.Add(query, Nonce+" "+Message)
			req.URL.RawQuery = q.Encode()

			resp, err := client.Do(req)
			if err != nil {
				return err
			}

			if resp.StatusCode != http.StatusOK &&
				resp.StatusCode != http.StatusNoContent &&
				resp.StatusCode != http.StatusCreated {
				return errors.New("status not OK")
			}

			resp.Body.Close()
		}

		future := async.Exec(func() (out interface{}, err error) {
			return DoAsyncUpdateCounter(baseContext, counter+1, id)
		})

		_, errorAwait := future.Await()

		if errorAwait != nil {
			return errorAwait
		}

		future = async.Exec(func() (out interface{}, err error) {
			return DoAsyncUpdateMessage(baseContext, id)
		})

		_, errorAwait = future.Await()

		if errorAwait != nil {
			return errorAwait
		}

		//update db that ok
		return nil
	})

	if err != nil {
		panic(err)
	}

	err = m.Register("CleanDb", func(job *jobpool.Job) error {
		_, errRequest := baseContext.Database.Db.Exec("DELETE FROM messages WHERE delivered_time != 0 AND delivered_time <= ?", time.Now().UnixNano())
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		_, errRequest = baseContext.Database.Db.Exec("DELETE FROM jobqueue_jobs WHERE state=\"succeeded\" AND completed <= ?", time.Now().UnixNano())
		if errRequest != nil {
			return errors.New("Unable to query: " + errRequest.Error())
		}
		//update db that ok
		return nil
	})

	if err != nil {
		panic(err)
	}

	// Start the manager
	err = m.Start()
	if err != nil {
		panic(err)
	}

	return m
}

func DoAsyncUpdateConfirmed(baseContext storage.Context, Id string) (out interface{}, err error) {
	result, err := baseContext.Database.Db.Exec(`UPDATE callbackurl SET confirmed = ? WHERE id = ?`, 1, Id)
	// Imposible deadlock, because db will be unlocked after some unpredicted time
	if err != nil {
		time.Sleep(time.Duration(100) * time.Nanosecond) // Let's try in 100 nanoseconds
		return DoAsyncUpdateConfirmed(baseContext, Id)
	}

	return result, nil
}

func DoAsyncUpdateCounter(baseContext storage.Context, counter, id int) (out interface{}, err error) {
	result, err := baseContext.Database.Db.Exec(`UPDATE callbackurl SET counter = ? WHERE id = ?`, counter, id)
	// Imposible deadlock, because db will be unlocked after some unpredicted time
	if err != nil {
		time.Sleep(time.Duration(100) * time.Nanosecond) // Let's try in 100 nanoseconds
		return DoAsyncUpdateCounter(baseContext, counter, id)
	}

	return result, nil
}

func DoAsyncUpdateMessage(baseContext storage.Context, id int) (out interface{}, err error) {
	result, err := baseContext.Database.Db.Exec(`UPDATE messages SET delivered_time = ? WHERE callbackurl_id = ?`, time.Now().UnixNano(), id)
	// Imposible deadlock, because db will be unlocked after some unpredicted time
	if err != nil {
		time.Sleep(time.Duration(100) * time.Nanosecond) // Let's try in 100 nanoseconds
		return DoAsyncUpdateMessage(baseContext, id)
	}

	return result, nil
}
