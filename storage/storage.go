package storage

import (
	"database/sql"
	"fmt"
	"log"
	"os"
	"path/filepath"
	"strings"

	_ "github.com/mattn/go-sqlite3"
)

type Database struct {
	// Pointer to initialized database connection.
	Db *sql.DB
}

type CallbackURLSchema struct {
	Id                 int    `json:"id"`
	URL                string `json:"url"`
	Method             string `json:"method"`
	Query              string `json:"query"`
	Confirmed          bool   `json:"confirmed"`
	Counter            int    `json:"counter"`
	VerificationWay    string `json:"verification_way"`
	VerificationSecret string `json:"verification_secret"`
	CreatedTime        int    `json:"created_time"`
	UpdatedTime        int    `json:"updated_time"`
}

var start_schema = `
CREATE TABLE IF NOT EXISTS database_info (
    id              INTEGER PRIMARY KEY AUTOINCREMENT,
    name            VARCHAR(512)    NOT NULL UNIQUE,
    value           INT             NOT NULL
);
INSERT OR IGNORE INTO database_info (name, value) VALUES ("version", 1);
INSERT OR IGNORE INTO database_info (name, value) VALUES ("published_time", 0);
											
CREATE TABLE IF NOT EXISTS callbackurl (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
	hash                VARCHAR(512)    NOT NULL,
	url                 VARCHAR(512)    NOT NULL,
	method              VARCHAR(512)    NOT NULL,
    query               VARCHAR(512)    NOT NULL,
	confirmed           INT             NOT NULL,
	url_type            INT             NOT NULL,
	verification_way    INT             NOT NULL,
	verification_secret VARCHAR(512)    NOT NULL,
	counter             INT             NOT NULL,
    created_time        INT             NOT NULL,
	updated_time        INT             NOT NULL
);

CREATE TABLE IF NOT EXISTS messages (
    id                  INTEGER PRIMARY KEY AUTOINCREMENT,
	callbackurl_id      INTEGER         NOT NULL,
	key                 VARCHAR(512)    NOT NULL,
	nonce               VARCHAR(512)    NOT NULL,
    message             TEXT            NOT NULL,
	created_time        INT             NOT NULL,
	delivered_time      INT             NOT NULL
);
`

func (d *Database) Initialize() {
	fmt.Println("Initializing database...")

	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exPath := filepath.Dir(ex)

	//runtime.LockOSThread()
	db_path := "./index.db"
	if !strings.Contains(exPath, "/tmp") && !strings.Contains(exPath, "\\Temp") {
		db_path = filepath.Join(exPath, "index.db")
	}

	// Connect to database.

	fmt.Println("Database path: " + db_path)
	db, err := sql.Open("sqlite3", db_path)
	if err != nil {
		log.Fatal(err)
	}

	db.SetConnMaxLifetime(-1)
	db.SetMaxIdleConns(-1)

	d.Db = db

	res, err := d.Db.Exec(start_schema)

	if err != nil {
		log.Fatal(res, err)
	}
}

func (d *Database) Close() {
	fmt.Println("Closing database...")

	d.Db.Close()

	//runtime.UnlockOSThread()
}
