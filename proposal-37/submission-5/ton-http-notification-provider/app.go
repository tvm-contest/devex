package main

import (
	"context"
	"errors"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"ton-http-notification-provider/jobpool"
	"ton-http-notification-provider/jobpoolqueue"
	"ton-http-notification-provider/kafkalistener"
	"ton-http-notification-provider/router"
	"ton-http-notification-provider/storage"

	"github.com/gin-gonic/gin"
	"github.com/joho/godotenv"
	"github.com/patrickmn/go-cache"
	"github.com/robfig/cron/v3"
)

var gctx storage.Context

func main() {
	gctx = storage.Context{}

	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "/tmp") || strings.Contains(exPath, "\\Temp") {
		godotenv.Load()
	} else {
		godotenv.Load(filepath.Join(exPath, ".env"))
	}

	gctx.Parameters = &storage.EnvVariables{
		Port:                       "3000",
		EndpointURL:                "",
		KafkaURL:                   "notification.services.tonlabs.io:29092",
		KafkaLogin:                 "",
		KafkaPassword:              "",
		KafkaTopic:                 "",
		VerificationPeriodAfter:    5,
		VerificationPeriodRetry:    45000000000,
		MessageSendingPeriodRetry:  45000000000,
		MessageSendingRetryBackoff: "exponential",
		MessageSendingMaxRetry:     10,
		CronScheduleClearDb:        "",
	}

	gctx.Parameters = storage.SetUpEnvVariables(gctx.Parameters)

	if gctx.Parameters.EndpointURL == "" {
		panic("You must set up ENDPOINT_URL environment variable")
	}

	if gctx.Parameters.KafkaLogin == "" {
		panic("You must set up KAFKA_LOGIN environment variable")
	}

	if gctx.Parameters.KafkaPassword == "" {
		panic("You must set up KAFKA_PASSWORD environment variable")
	}

	if gctx.Parameters.KafkaTopic == "" {
		panic("You must set up KAFKA_TOPIC environment variable")
	}

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

	if gctx.Parameters.CronScheduleClearDb != "" {
		_, err := cron.ParseStandard(gctx.Parameters.CronScheduleClearDb)
		if err == nil {
			c := cron.New()
			println("Cron is running")
			c.AddFunc(gctx.Parameters.CronScheduleClearDb, func() {
				err := gctx.JobManager.Add(context.Background(),
					&jobpool.Job{Topic: "CleanDb",
						MaxRetry: 100})
				if err != nil {
					log.Println(err)
				}
			})
			c.Start()
		} else {
			log.Fatal("Cron format is wrong")
		}
	}

	//Kafka listener connection
	kafkalistener.Listener(gctx)

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 10 seconds.
	quit := make(chan os.Signal)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// Stop the manager, either via Stop/Close (which stops after all workers are finished)
	// or CloseWithTimeout (which gracefully waits for a specified time span)
	// wait for 5 seconds before forced stop
	if err := gctx.JobManager.CloseWithTimeout(5 * time.Second); err != nil {
		panic(err)
	}

	// The context is used to inform the server it has 10 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 10*time.Second)
	defer cancel()

	if err := gctx.Server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}
}
