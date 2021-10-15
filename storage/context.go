package storage

import (
	"net/http"
	"os"
	"strconv"
	"ton-http-notification-provider/jobpool"

	"github.com/gin-gonic/gin"
	"github.com/patrickmn/go-cache"
)

type EnvVariables struct {
	Port                       string // port endpoint which provides this service
	EndpointURL                string // url endpoint which provides this service
	KafkaURL                   string // url to connect with Kafka
	KafkaLogin                 string // login to connect with Kafka
	KafkaPassword              string // password to connect with Kafka
	KafkaTopic                 string // topic name
	VerificationPeriodAfter    int    // in minutes
	VerificationPeriodRetry    int64  // in unixnano
	MessageSendingPeriodRetry  int64  // in unixnano
	MessageSendingRetryBackoff string // constant or exponential
	MessageSendingMaxRetry     int    // how many attempts for the successful sending
	CronScheduleClearDb        string // cron syntax
	VerificationType           string //verification type
	Secret                     string // for test server
}

type Context struct {
	Database   *Database
	Cache      *cache.Cache
	Router     *gin.Engine
	Server     *http.Server
	JobManager *jobpool.Manager
	Parameters *EnvVariables
}

type URLType int64

const (
	Domain URLType = 1
	IP     URLType = 2
)

func (s URLType) String() string {
	switch s {
	case Domain:
		return "domain"
	case IP:
		return "ip"
	}
	return "unknown"
}

type VerificationType int64

const (
	DNS     VerificationType = 1
	File    VerificationType = 2
	Metatag VerificationType = 3
)

func (s VerificationType) String() string {
	switch s {
	case DNS:
		return "DNS"
	case File:
		return "File"
	case Metatag:
		return "Metatag"
	}
	return "unknown"
}

func VerificationTypeFromString(s string) VerificationType {
	switch s {
	case "DNS":
		return DNS
	case "File":
		return File
	case "Metatag":
		return Metatag
	}
	return 0
}

func SetUpEnvVariables(env *EnvVariables) *EnvVariables {
	if value, ok := os.LookupEnv("PORT"); ok {
		env.Port = value
	}

	if value, ok := os.LookupEnv("ENDPOINT_URL"); ok {
		env.EndpointURL = value
	}

	if value, ok := os.LookupEnv("KAFKA_URL"); ok {
		env.KafkaURL = value
	}

	if value, ok := os.LookupEnv("KAFKA_LOGIN"); ok {
		env.KafkaLogin = value
	}

	if value, ok := os.LookupEnv("KAFKA_PASSWORD"); ok {
		env.KafkaPassword = value
	}

	if value, ok := os.LookupEnv("KAFKA_TOPIC"); ok {
		env.KafkaTopic = value
	}

	if value, ok := os.LookupEnv("VERIFICATION_PERIOD_AFTER"); ok {
		if i, err := strconv.Atoi(value); err == nil {
			env.VerificationPeriodAfter = int(i)
		}
	}

	if value, ok := os.LookupEnv("VERIFICATION_PERIOD_RETRY"); ok {
		if i, err := strconv.Atoi(value); err == nil {
			env.VerificationPeriodRetry = int64(i)
		}
	}

	if value, ok := os.LookupEnv("MESSAGE_SENDING_PERIOD_RETRY"); ok {
		if i, err := strconv.Atoi(value); err == nil {
			env.MessageSendingPeriodRetry = int64(i)
		}
	}

	if value, ok := os.LookupEnv("MESSAGE_SENDING_RETRY_BACKOFF"); ok {
		env.MessageSendingRetryBackoff = value
	}

	if value, ok := os.LookupEnv("MESSAGE_SENDING_MAX_RETRY"); ok {
		if i, err := strconv.Atoi(value); err == nil {
			env.MessageSendingMaxRetry = int(i)
		}
	}

	if value, ok := os.LookupEnv("CRON_SCHEDULE_CLEAR_DB"); ok {
		env.CronScheduleClearDb = value
	}

	return env
}
