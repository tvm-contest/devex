package router

import (
	"context"
	"crypto/md5"
	"database/sql"
	"encoding/hex"
	"log"
	"net"
	"net/http"
	"net/url"
	"os"
	"path/filepath"
	"strconv"
	"strings"
	"time"

	b64 "encoding/base64"
	"ton-http-notification-provider/async"
	"ton-http-notification-provider/jobpool"
	"ton-http-notification-provider/storage"

	"github.com/gin-contrib/cors"
	"github.com/gin-gonic/gin"
)

func Paths(baseContext storage.Context) {
	ex, err := os.Executable()
	if err != nil {
		panic(err)
	}
	exPath := filepath.Dir(ex)

	if strings.Contains(exPath, "/tmp") || strings.Contains(exPath, "\\Temp") {
		baseContext.Router.LoadHTMLGlob("templates/*.html")
		baseContext.Router.Static("misc", "templates/misc")
	} else {
		baseContext.Router.LoadHTMLGlob(filepath.Join(exPath, "templates/*.html"))
		baseContext.Router.Static("misc", filepath.Join(exPath, "templates/misc"))
	}

	baseContext.Router.Use(cors.Default())

	baseContext.Router.GET("/", func(c *gin.Context) {
		jsonInfo := gin.H{
			"name":        "HTTP notification provider",
			"description": "HTTP notification module provides service for delivering events that happened on Free TON blockchain network",
			"logo":        "/misc/images/logo.png",
			"input_format": gin.H{"method": "POST", "url": "/", "params": gin.H{
				"hash": "Recipient id",
				"data": "URL* Method? Query?. You may use only URL. Method and Query are optional parameters. Method can be GET, POST, PUT, PATCH, by default POST. Query is a parameter line, by default is 'param'",
			}},
			"support_contact": "support@mytonwallet.com",
		}
		if c.Query("json") != "" {
			c.JSON(http.StatusOK, jsonInfo)
		} else {
			c.HTML(http.StatusOK, "index.html", jsonInfo)
		}
	})

	baseContext.Router.POST("/", func(c *gin.Context) {
		hash := c.PostForm("hash")
		data := c.PostForm("data")
		dataDec, _ := b64.StdEncoding.DecodeString(data)
		dataArr := strings.Split(string(dataDec), " ")

		if len(dataArr) > 3 {
			c.String(http.StatusOK, "You must specify url. Format: URL Method Query")
			return
		}

		var callbackUrl, method, query string

		callbackUrl = dataArr[0]
		if len(callbackUrl) == 0 {
			c.String(http.StatusOK, "You must specify url. Format: URL Method Query")
			return
		}

		method = "POST"
		query = "param"
		if len(dataArr) > 1 {
			switch dataArr[1] {
			case
				"GET",
				//POST, // we don't need because above
				"PUT",
				"PATCH":
				method = dataArr[1]
			}
		}
		if len(dataArr) > 2 {
			query = dataArr[2]
		}

		resultParser, errParser := url.Parse(callbackUrl)

		if resultParser.Host == "" || errParser != nil {
			c.String(http.StatusOK, "Callback URL is not valid")
			return
		}

		if resultParser.Scheme != "http" && resultParser.Scheme != "https" {
			c.String(http.StatusOK, "Callback URL scheme is not valid. Only http:// or https://")
			return
		}

		host, _, _ := net.SplitHostPort(resultParser.Host)
		if host == "" {
			host = resultParser.Host
		}
		_, hostErr := net.LookupHost(host)
		_, ipErr := net.LookupIP(host)

		if os.Getenv("test") != "1" && hostErr != nil && ipErr != nil { // need ot skip checking when tests
			c.String(http.StatusOK, "Callback URL host is not working domain or IP address")
			return
		}

		future := async.Exec(func() (out interface{}, err error) {
			return DoAsyncInsert(baseContext, hash, callbackUrl, method, query)
		})

		result, errorAwait := future.Await()

		if errorAwait != nil {
			log.Println(errorAwait.Error())
			c.String(http.StatusBadGateway, "Repeat your request later")
			return
		}

		_recordId, _ := result.(sql.Result).LastInsertId()
		//log.Printf("Your id is %s. You need to confirm your rights for this endpoint. Please, follow to the %s to pass verification procedure.", strconv.Itoa(int(_recordId)), baseContext.Parameters.EndpointURL+"verify/"+strconv.Itoa(int(_recordId)))
		c.String(http.StatusOK, "Your id is %s. You need to confirm your rights for this endpoint. Please, follow to the %s to pass verification procedure.", strconv.Itoa(int(_recordId)), baseContext.Parameters.EndpointURL+"verify/"+strconv.Itoa(int(_recordId)))
	})

	baseContext.Router.GET("/get/:id", func(c *gin.Context) {
		Id := c.Param("id")
		if Id == "" {
			c.String(http.StatusBadRequest, "You must specify id")
			return
		}
		requestResult, errRequest := baseContext.Database.Db.Query(`SELECT id, url, method, query,
																	confirmed, verification_way, verification_secret,
																	counter, created_time, updated_time 
																	FROM callbackurl 
																		WHERE id = ?`, Id)
		if errRequest != nil {
			log.Printf("Unable to query: %s", errRequest.Error())
			c.String(http.StatusBadGateway, "Repeat your request later")
			return
		}
		var callbackURL storage.CallbackURLSchema
		id := 0
		for requestResult.Next() {
			var confirmed, verification_way, counter, created_time, updated_time int
			var verification_secret, url, method, query string
			err := requestResult.Scan(&id, &url, &method, &query, &confirmed, &verification_way, &verification_secret, &counter, &created_time, &updated_time)
			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}

			callbackURL = storage.CallbackURLSchema{Id: id, URL: url,
				Method: method, Query: query,
				Confirmed:          confirmed == 1,
				VerificationWay:    storage.VerificationType.String(storage.VerificationType(verification_way)),
				VerificationSecret: verification_secret,
				Counter:            counter,
				CreatedTime:        created_time / (10 ^ 6),
				UpdatedTime:        updated_time / (10 ^ 6),
			}
		}
		requestResult.Close()

		if id == 0 {
			c.String(http.StatusNotFound, "Id is not existed")
			return
		}

		if c.Query("json") != "" {
			c.JSON(http.StatusOK, callbackURL)
		} else {
			c.HTML(http.StatusOK, "callbackURL_info.html", callbackURL)
		}
	})

	baseContext.Router.GET("/verify/:id", func(c *gin.Context) {
		Id := c.Param("id")
		if Id == "" {
			c.String(http.StatusBadRequest, "You must specify id")
			return
		}
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT id, confirmed, url_type, verification_way FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			log.Printf("Unable to query: %s", errRequest.Error())
			c.String(http.StatusBadGateway, "Repeat your request later")
			return
		}
		var id string
		var url_type, confirmed, verification_way int
		for requestResult.Next() {
			err := requestResult.Scan(&id, &confirmed, &url_type, &verification_way)
			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}
		}
		requestResult.Close()
		if len(id) == 0 {
			c.String(http.StatusNotFound, "This id is not created yet")
			return
		}
		c.HTML(http.StatusOK, "verification_way.html", gin.H{})
	})

	baseContext.Router.POST("/verification_way/:id", func(c *gin.Context) {
		Id := c.Param("id")
		if Id == "" {
			c.String(http.StatusBadRequest, "You must specify id")
			return
		}
		VerificationWay := c.PostForm("verification_way")

		if len(VerificationWay) == 0 {
			c.String(http.StatusBadRequest, "need to specify verification_way param")
			return
		}
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT url, confirmed, url_type FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			log.Printf("Unable to query: %s", errRequest.Error())
			c.String(http.StatusBadGateway, "Repeat your request later")
			return
		}
		var url_type, confirmed int
		var callbackurl string
		for requestResult.Next() {
			err := requestResult.Scan(&callbackurl, &confirmed, &url_type)
			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}
		}
		requestResult.Close()
		if confirmed != 1 {
			if url_type == 2 && VerificationWay == "DNS" { // if Ip and DNS
				VerificationWay = "File"
			}
			secretHash := md5.Sum([]byte(callbackurl + strconv.Itoa(int(time.Now().Unix()))))

			future := async.Exec(func() (out interface{}, err error) {
				return DoAsyncUpdate(baseContext, storage.VerificationTypeFromString(VerificationWay), hex.EncodeToString(secretHash[:]), time.Now().Unix(), Id)
			})

			_, errorAwait := future.Await()

			if errorAwait != nil {
				log.Println(errorAwait.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}

			var TopicName string
			switch storage.VerificationTypeFromString(VerificationWay) {
			case storage.DNS:
				TopicName = "CheckDNS"
			case storage.Metatag:
				TopicName = "CheckMetatag"
			case storage.File:
				TopicName = "CheckFile"
			}
			parsedUrl, _ := url.Parse(callbackurl)
			urlRoot := parsedUrl.Scheme + "://" + parsedUrl.Host

			err := baseContext.JobManager.Add(context.Background(),
				&jobpool.Job{Topic: TopicName,
					After:        time.Now().Add(time.Minute * time.Duration(baseContext.Parameters.VerificationPeriodAfter)).UnixNano(),
					RetryWait:    baseContext.Parameters.VerificationPeriodRetry,
					RetryBackoff: "exponential",
					MaxRetry:     10,
					Args:         []interface{}{Id, urlRoot, hex.EncodeToString(secretHash[:])}})
			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}

			c.String(http.StatusOK, "Ok")
		} else {
			c.String(http.StatusNotFound, "Domain is confirmed already")
		}
	})

	baseContext.Router.GET("/verification_way/:id", func(c *gin.Context) {
		Id := c.Param("id")
		if Id == "" {
			c.String(http.StatusBadRequest, "You must specify id")
			return
		}
		requestResult, errRequest := baseContext.Database.Db.Query("SELECT id, url, confirmed, verification_way, verification_secret FROM callbackurl WHERE id = ?", Id)
		if errRequest != nil {
			log.Printf("Unable to query:%s", errRequest.Error())
			c.String(http.StatusBadGateway, "Repeat your request later")
			return
		}
		var confirmed int
		var verification_way int64
		var id, url, verification_secret string
		for requestResult.Next() {
			err := requestResult.Scan(&id, &url, &confirmed, &verification_way, &verification_secret)
			if err != nil {
				log.Println(err.Error())
				c.String(http.StatusBadGateway, "Repeat your request later")
				return
			}
		}
		requestResult.Close()

		if len(url) == 0 {
			c.String(http.StatusNotFound, "This id is not created yet")
			return
		}
		if confirmed != 1 {
			c.HTML(http.StatusOK, "verification_"+storage.VerificationType.String(storage.VerificationType(verification_way))+".html",
				gin.H{
					"id":                  id,
					"url":                 url,
					"verification_secret": verification_secret,
				})
		} else {
			c.String(http.StatusNotFound, "Domain is confirmed already")
		}
	})
}

func DoAsyncInsert(baseContext storage.Context, hash, callbackUrl, method, query string) (out interface{}, err error) {
	now := time.Now().Unix()
	urlType := storage.Domain
	verificationWay := storage.DNS
	resultParser, _ := url.Parse(callbackUrl)
	if net.ParseIP(resultParser.Host) != nil {
		urlType = storage.IP
		verificationWay = storage.File
	}
	result, errInsert :=
		baseContext.Database.Db.Exec(
			`INSERT INTO callbackurl
			(	id,
				hash,
				url,
				method,
				query, 
				confirmed,
				url_type,
				verification_way,
				verification_secret,
				counter,
				created_time,
				updated_time)
		VALUES 
		(null, $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)`,
			hash,
			callbackUrl,
			method,
			query,
			0,
			urlType,
			verificationWay,
			"",
			0,
			now,
			now)

	// Imposible deadlock, because db will be unlocked after some unpredicted time
	if errInsert != nil {
		time.Sleep(time.Duration(100) * time.Nanosecond) // Let's try in 100 nanoseconds
		return DoAsyncInsert(baseContext, hash, callbackUrl, method, query)
	}

	return result, nil
}

func DoAsyncUpdate(baseContext storage.Context, verificationType storage.VerificationType, hash string, timeStamp int64, id string) (out interface{}, err error) {
	result, errUpdate := baseContext.Database.Db.Exec(
		`UPDATE callbackurl SET verification_way = $1, verification_secret = $2, updated_time = $3 WHERE id = $4`,
		verificationType,
		hash,
		timeStamp,
		id,
	)

	// Imposible deadlock, because db will be unlocked after some unpredicted time
	if errUpdate != nil {
		time.Sleep(time.Duration(100) * time.Nanosecond) // Let's try in 100 nanoseconds
		return DoAsyncUpdate(baseContext, verificationType, hash, timeStamp, id)
	}

	return result, nil
}
