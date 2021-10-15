package main

import (
	"context"
	"errors"
	"fmt"
	"io"
	"log"
	"net/http"
	"net/url"
	"os"
	"os/signal"
	"strconv"
	"strings"
	"syscall"
	"testing"
	"time"

	b64 "encoding/base64"

	"ton-http-notification-provider/jobpool"
	"ton-http-notification-provider/jobpoolqueue"
	"ton-http-notification-provider/router"
	"ton-http-notification-provider/storage"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
)

func TestRouting_Post_From_Debot(t *testing.T) {
	os.Setenv("test", "1")

	gctx = storage.Context{}

	gctx.Parameters = &storage.EnvVariables{
		Port:                       "3000",
		EndpointURL:                "http://127.0.0.1/",
		KafkaURL:                   "notification.services.tonlabs.io:29092",
		KafkaLogin:                 "mtw",
		KafkaPassword:              "silent-source-inmate-sort",
		KafkaTopic:                 "notifications-6",
		VerificationPeriodAfter:    1,
		VerificationPeriodRetry:    45000000000,
		MessageSendingPeriodRetry:  45000000000,
		MessageSendingRetryBackoff: "exponential",
		MessageSendingMaxRetry:     10,
		CronScheduleClearDb:        "",
	}

	gctx.Parameters = storage.SetUpEnvVariables(gctx.Parameters)

	gctx.Router = gin.Default()

	gctx.Server = &http.Server{
		Addr:    ":" + gctx.Parameters.Port,
		Handler: gctx.Router,
	}

	println("Server is working on port:" + gctx.Parameters.Port)

	gctx.Cache = storage.GetCacheInstance("WebServer").Cache

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		if err := gctx.Server.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
			log.Printf("listen: %s\n", err)
		}
	}()

	gctx.Database = &storage.Database{}
	gctx.Database.Initialize()

	gctx.Cache.Set("ready", true, cache.NoExpiration)

	gctx.JobManager = jobpoolqueue.StartQueue(gctx)

	//Paths set up
	router.Paths(gctx)

	//Kafka listener connection
	// this step will be emulated
	//kafkalistener.Listener()

	TestCallbackUrl := "http://127.0.0.1:3000/hook"
	TestHash := "hash_to_match"
	encodedData := b64.StdEncoding.EncodeToString([]byte(TestCallbackUrl))

	// get ID
	data := url.Values{
		"hash": {"hash_to_match"},
		"data": {encodedData},
	}

	resp, err := http.PostForm(fmt.Sprintf("http://127.0.0.1%s/", gctx.Server.Addr), data)

	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status not OK")
	}

	body, err := io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	resp.Body.Close()

	if !strings.Contains(string(body), "Your id is") {
		t.Fatal(string(body))
	}

	Id := string(body)[11:strings.Index(string(body), ".")]

	println(fmt.Sprintf("Id: %s", Id))

	// choice verification way
	data = url.Values{
		"verification_way": {"File"},
	}

	resp, err = http.PostForm(fmt.Sprintf("http://127.0.0.1%s/verification_way/%s", gctx.Server.Addr, Id), data)

	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status not OK")
	}

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	resp.Body.Close()

	if string(body) != "Ok" {
		t.Fail()
	}

	//Get HTML with instructions
	resp, err = http.Get(fmt.Sprintf("http://127.0.0.1%s/verification_way/%s", gctx.Server.Addr, Id))

	if err != nil {
		t.Fatal(err)
	}

	if resp.StatusCode != http.StatusOK {
		t.Errorf("status not OK")
	}

	body, err = io.ReadAll(resp.Body)
	if err != nil {
		log.Fatalln(err)
	}

	resp.Body.Close()

	if !strings.Contains(string(body), "with name") {
		t.Fail()
	}

	Secret := string(body)[strings.Index(string(body), "with name")+13 : strings.Index(string(body), ".html")]

	gctx.Router.GET("/"+Secret+".html", func(c *gin.Context) {
		println("request is ok")
		c.JSON(http.StatusOK, gin.H{})
	})

	gctx.Router.POST("/hook", func(c *gin.Context) {
		fmt.Println(c.Request.FormValue("param"))
		println(fmt.Printf("We have received message for our callback URI - %s", c.PostForm("param")))
		c.JSON(http.StatusOK, gin.H{})
	})

	// Need to check that maybe confirmed already
	requestResult, errRequest := gctx.Database.Db.Query(`SELECT  id
																FROM callbackurl
																WHERE hash = ?`, TestHash)
	if errRequest != nil {
		log.Println("Unable to query: " + errRequest.Error())
		return
	}

	id := 0 // will be 0 if no result from db
	for requestResult.Next() {
		requestResult.Scan(&id)
	}

	requestResult.Close()

	if id == 0 {
		log.Println("id for such hash is not existed")
	}

	nonce := "test nonce"
	message := "test message"
	gctx.Database.Db.Exec(
		`INSERT INTO messages
			(	id,
				callbackurl_id,
				key,
				nonce,
				message,
				created_time,
				delivered_time
			)
		VALUES 
		(null, $1, $2, $3, $4, $5, $6)`,
		id,
		"123213",
		nonce,
		message,
		time.Now().UnixNano(),
		0)

	// Need to check that we can bypass locked db case
	for i := 0; i < 10; i++ {
		err = gctx.JobManager.Add(context.Background(),
			&jobpool.Job{Topic: "SendMessage",
				RetryWait:    gctx.Parameters.MessageSendingPeriodRetry,
				RetryBackoff: gctx.Parameters.MessageSendingRetryBackoff,
				MaxRetry:     gctx.Parameters.MessageSendingMaxRetry,
				Args:         []interface{}{strconv.Itoa(id), nonce, message}})
		if err != nil {
			panic(err)
		}
	}

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Stop the manager, either via Stop/Close (which stops after all workers are finished)
	// or CloseWithTimeout (which gracefully waits for a specified time span)
	// wait for 15 seconds before forced stop
	if err := gctx.JobManager.CloseWithTimeout(15 * time.Second); err != nil {
		panic(err)
	}

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := gctx.Server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}
}
