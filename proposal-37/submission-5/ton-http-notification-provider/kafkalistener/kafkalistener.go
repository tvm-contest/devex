package kafkalistener

import (
	"context"
	"fmt"
	"log"
	"strconv"
	"strings"
	"time"

	"ton-http-notification-provider/jobpool"
	"ton-http-notification-provider/storage"

	kafka "github.com/segmentio/kafka-go"
	"github.com/segmentio/kafka-go/sasl/scram"
)

func getKafkaReader(kafkaURL, kafkaLogin, kafkaPassword, topic string) *kafka.Reader {
	mechanism, err := scram.Mechanism(scram.SHA512, kafkaLogin, kafkaPassword)
	if err != nil {
		panic(err)
	}

	dialer := &kafka.Dialer{
		Timeout:       10 * time.Second,
		DualStack:     true,
		SASLMechanism: mechanism,
	}

	brokers := strings.Split(kafkaURL, ",")
	return kafka.NewReader(kafka.ReaderConfig{
		Brokers:  brokers,
		Dialer:   dialer,
		Topic:    topic,
		MinBytes: 10e3, // 10KB
		MaxBytes: 10e6, // 10MB
	})
}

func Listener(baseContext storage.Context) {
	kafkaURL := baseContext.Parameters.KafkaURL
	topic := baseContext.Parameters.KafkaTopic
	kafkaLogin := baseContext.Parameters.KafkaLogin
	kafkaPassword := baseContext.Parameters.KafkaPassword

	reader := getKafkaReader(kafkaURL, kafkaLogin, kafkaPassword, topic)

	defer reader.Close()

	for {
		m, err := reader.ReadMessage(context.Background())
		if err != nil {
			log.Fatalln(err)
		}

		parsedMessage := strings.Split(string(m.Value), " ")

		// Need to check that maybe confirmed already
		requestResult, errRequest := baseContext.Database.Db.Query(`SELECT  id
																	FROM callbackurl
																	WHERE hash = ?`, parsedMessage[0])
		if errRequest != nil {
			log.Println("Unable to query: " + errRequest.Error())
			continue
		}

		idCallbackUrl := 0 // will be 0 if no result from db
		for requestResult.Next() {
			requestResult.Scan(&idCallbackUrl)
		}

		requestResult.Close()

		if idCallbackUrl == 0 {
			log.Println(fmt.Scanf("id for such hash %f is not existed", parsedMessage[0]))
			continue
		}

		requestResult, errRequest = baseContext.Database.Db.Query(`SELECT  id
																	FROM messages
																	WHERE 
																	key = ? AND
																	nonce = ?`,
			string(m.Key),
			parsedMessage[1])
		if errRequest != nil {
			log.Println("Unable to query: " + errRequest.Error())
			continue
		}

		idMessage := 0 // will be 0 if no result from db
		for requestResult.Next() {
			requestResult.Scan(&idMessage)
		}

		requestResult.Close()
		if idMessage != 0 {
			log.Println("message id is existed already")
			continue
		}

		baseContext.Database.Db.Exec(
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
			idCallbackUrl,
			string(m.Key),
			parsedMessage[1],
			parsedMessage[2],
			time.Now().UnixNano(),
			0)

		err = baseContext.JobManager.Add(context.Background(),
			&jobpool.Job{Topic: "SendMessage",
				RetryWait:    baseContext.Parameters.MessageSendingPeriodRetry,
				RetryBackoff: baseContext.Parameters.MessageSendingRetryBackoff,
				MaxRetry:     baseContext.Parameters.MessageSendingMaxRetry,
				Args:         []interface{}{strconv.Itoa(idCallbackUrl), parsedMessage[1], parsedMessage[2]}})
		if err != nil {
			panic(err)
		}

		//fmt.Printf("key %s , hash %s , nonce %s , message %s\n", string(m.Key), parsedMessage[0], parsedMessage[1], parsedMessage[2])
	}
}
