package main

import (
	"context"
	"errors"
	"fmt"
	"log"
	"net/http"
	"os"
	"os/signal"
	"path/filepath"
	"strings"
	"syscall"
	"time"

	"github.com/gin-gonic/gin"
	"github.com/sirupsen/logrus"
)

type EnvVariables struct {
	VerificationType string //verification type
	Secret           string // for test server
}

func main() {

	var VerificationType, Secret, Port, Query string

	if value, ok := os.LookupEnv("PORT"); ok {
		Port = value
	} else {
		panic("PORT variable must be set.")
	}

	if value, ok := os.LookupEnv("VERIFICATION_TYPE"); ok {
		VerificationType = value
	} else {
		panic("VERIFICATION_TYPE variable must be set. Possible value: DNS, File, Metatag")
	}

	if value, ok := os.LookupEnv("SECRET"); ok {
		Secret = value
	} else {
		panic("SECRET variable must be set.")
	}

	if value, ok := os.LookupEnv("QUERY"); ok {
		Query = value
	} else {
		Query = "param"
	}

	println("Server is working on port:" + Port)

	Router := gin.Default()

	Server := &http.Server{
		Addr:    ":" + Port,
		Handler: Router,
	}

	// Initializing the server in a goroutine so that
	// it won't block the graceful shutdown handling below
	go func() {
		if err := Server.ListenAndServe(); err != nil && errors.Is(err, http.ErrServerClosed) {
			log.Printf("listen: %s\n", err)
		}
	}()

	//Paths set up
	// Create a new instance of the logger. You can have any number of instances.
	var log = logrus.New()

	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "/tmp") || strings.Contains(exPath, "\\Temp") {
		Router.LoadHTMLGlob("templates/*.html")
	} else {
		Router.LoadHTMLGlob(filepath.Join(exPath, "templates/*.html"))
	}

	//  baseContext.Parameters.VerificationType == "DNS"
	//  need to setup DNS records

	if VerificationType == "File" {
		Router.GET("/"+Secret+".html", func(c *gin.Context) {
			c.String(http.StatusOK, Secret)
		})
	}

	if VerificationType == "Metatag" {
		Router.GET("/", func(c *gin.Context) {
			c.HTML(http.StatusOK, "testmetatagpage.html",
				gin.H{
					"secret": Secret,
				})
		})
	}

	Router.POST("/callback_url", func(c *gin.Context) {
		param := c.PostForm(Query)

		log.Out = os.Stdout
		// You could set this to any `io.Writer` such as a file
		file, err := os.OpenFile("logrus.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			log.Out = file
		} else {
			log.Info("Failed to log to file, using default stderr")
		}

		paramArray := strings.Split(param, " ")

		if len(paramArray) != 2 {
			buf := make([]byte, 1024)
			num, _ := c.Request.Body.Read(buf)
			reqBody := string(buf[0:num])
			log.WithFields(logrus.Fields{
				"query":   Query,
				"param":   param,
				"reqBody": reqBody,
			}).Info(fmt.Printf("We have got WRONG message with length %d", len(param)))
			c.String(http.StatusNoContent, "Error")
			return
		}

		log.WithFields(logrus.Fields{
			"nonce":   paramArray[0],
			"message": paramArray[1],
		}).Info(fmt.Printf("We have got message with length %d", len(param)))

		c.String(http.StatusOK, "Ok")
	})

	Router.PATCH("/callback_url", func(c *gin.Context) {
		param := c.PostForm(Query)

		log.Out = os.Stdout
		// You could set this to any `io.Writer` such as a file
		file, err := os.OpenFile("logrus.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			log.Out = file
		} else {
			log.Info("Failed to log to file, using default stderr")
		}

		paramArray := strings.Split(param, " ")

		if len(paramArray) != 2 {
			buf := make([]byte, 1024)
			num, _ := c.Request.Body.Read(buf)
			reqBody := string(buf[0:num])
			log.WithFields(logrus.Fields{
				"query":   Query,
				"param":   param,
				"reqBody": reqBody,
			}).Info(fmt.Printf("We have got WRONG message with length %d", len(param)))
			c.String(http.StatusNoContent, "Error")
			return
		}

		log.WithFields(logrus.Fields{
			"nonce":   paramArray[0],
			"message": paramArray[1],
		}).Info(fmt.Printf("We have got message with length %d", len(param)))

		c.String(http.StatusOK, "Ok")
	})

	Router.PUT("/callback_url", func(c *gin.Context) {
		param := c.PostForm(Query)

		log.Out = os.Stdout
		// You could set this to any `io.Writer` such as a file
		file, err := os.OpenFile("logrus.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			log.Out = file
		} else {
			log.Info("Failed to log to file, using default stderr")
		}

		paramArray := strings.Split(param, " ")

		if len(paramArray) != 2 {
			buf := make([]byte, 1024)
			num, _ := c.Request.Body.Read(buf)
			reqBody := string(buf[0:num])
			log.WithFields(logrus.Fields{
				"query":   Query,
				"param":   param,
				"reqBody": reqBody,
			}).Info(fmt.Printf("We have got WRONG message with length %d", len(param)))
			c.String(http.StatusNoContent, "Error")
			return
		}

		log.WithFields(logrus.Fields{
			"nonce":   paramArray[0],
			"message": paramArray[1],
		}).Info(fmt.Printf("We have got message with length %d", len(param)))

		c.String(http.StatusOK, "Ok")
	})

	Router.GET("/callback_url", func(c *gin.Context) {
		param := c.Query(Query)

		log.Out = os.Stdout
		// You could set this to any `io.Writer` such as a file
		file, err := os.OpenFile("logrus.log", os.O_CREATE|os.O_WRONLY|os.O_APPEND, 0666)
		if err == nil {
			log.Out = file
		} else {
			log.Info("Failed to log to file, using default stderr")
		}

		paramArray := strings.Split(param, " ")

		if len(paramArray) != 2 {
			buf := make([]byte, 1024)
			num, _ := c.Request.Body.Read(buf)
			reqBody := string(buf[0:num])
			log.WithFields(logrus.Fields{
				"query":   Query,
				"param":   param,
				"reqBody": reqBody,
			}).Info(fmt.Printf("We have got WRONG message with length %d", len(param)))
			c.String(http.StatusNoContent, "Error")
			return
		}

		log.WithFields(logrus.Fields{
			"nonce":   paramArray[0],
			"message": paramArray[1],
		}).Info(fmt.Printf("We have got message with length %d", len(param)))

		c.String(http.StatusOK, "Ok")
	})

	Router.GET("/log", func(c *gin.Context) {
		c.File("logrus.log")
	})

	// Wait for interrupt signal to gracefully shutdown the server with
	// a timeout of 5 seconds.
	quit := make(chan os.Signal)
	// kill (no param) default send syscall.SIGTERM
	// kill -2 is syscall.SIGINT
	// kill -9 is syscall.SIGKILL but can't be catch, so don't need add it
	signal.Notify(quit, syscall.SIGINT, syscall.SIGTERM)
	<-quit

	// The context is used to inform the server it has 5 seconds to finish
	// the request it is currently handling
	ctx, cancel := context.WithTimeout(context.Background(), 5*time.Second)
	defer cancel()

	if err := Server.Shutdown(ctx); err != nil {
		log.Fatal("Server forced to shutdown: ", err)
	}
}
