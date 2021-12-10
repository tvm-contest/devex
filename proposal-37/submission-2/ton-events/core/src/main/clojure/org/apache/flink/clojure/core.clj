(ns org.apache.flink.clojure.core
  (:require [org.apache.flink.clojure.dto :refer :all])
  (:require [org.apache.flink.clojure.impl :refer :all])
  (:import (org.apache.flink.core.fs Path)
           (org.apache.flink.streaming.api CheckpointingMode)
           (org.apache.flink.streaming.api.environment StreamExecutionEnvironment
                                                       CheckpointConfig$ExternalizedCheckpointCleanup)
           (org.apache.flink.streaming.api.datastream AsyncDataStream)
           (org.apache.flink.streaming.connectors.rabbitmq RMQSink
                                                           RMQSource)
           (org.apache.flink.streaming.connectors.rabbitmq.common RMQConnectionConfig$Builder)
           (org.apache.flink.api.common.typeinfo TypeInformation)
           (org.apache.flink.api.common.serialization SerializationSchema
                                                      DeserializationSchema)
           (org.apache.flink.api.common.eventtime WatermarkStrategy)
           (org.apache.flink.connector.kafka.source KafkaSourceOfStrings)
           (org.apache.flink.connector.kafka.source.enumerator.initializer OffsetsInitializer)
           (org.apache.flink.connector.kafka.source.reader.deserializer KafkaRecordDeserializationSchema)
           (org.apache.flink.java StringKeySelector)
           (org.apache.flink.clojure.dto CommandEvent
                                         QueueProviderEvent))
  (:gen-class :main true))

(defn build-kafka-source
  [{:keys [topic username password]}]
  (-> (KafkaSourceOfStrings/builder)
      (.setBootstrapServers (or (System/getenv "QUEUE_PROVIDER_ADDRESS")
                                (throw (Exception. "QUEUE_PROVIDER_ADDRESS environment variable must be provided"))))
      (.setTopics (into-array String [topic]))
      (.setGroupId (or (System/getenv "QUEUE_PROVIDER_GROUPID")
                       "ton.events"))
      (.setDeserializer (reify KafkaRecordDeserializationSchema
                          (deserialize [_ record out]
                            (let [idempotency-key (-> record .key String.)
                                  timestamp (.timestamp record)
                                  [hash nonce encrypted-message] (-> record .value String. (.split " "))
                                  event (QueueProviderEvent. idempotency-key
                                                             hash
                                                             nonce
                                                             encrypted-message
                                                             timestamp)]
                              (.collect out event)))
                          (getProducedType [_] (TypeInformation/of (class QueueProviderEvent)))))
      (.setStartingOffsets (OffsetsInitializer/latest))
      (.setProperty "partition.discovery.interval.ms" "60000")
      (.setProperty "security.protocol" "SASL_PLAINTEXT")
      (.setProperty "sasl.mechanism" "SCRAM-SHA-512")
      (.setProperty "sasl.jaas.config"
                    (format "org.apache.kafka.common.security.scram.ScramLoginModule required username=\"%s\" password=\"%s\";"
                            username
                            password))
      .build))

(defn build-rmq-source
  [{:keys [amqp-uri queue]}]
  (let [config (-> (RMQConnectionConfig$Builder.)
                   (.setUri amqp-uri)
                   .build)
        use-correlation-id false
        deserialization-schema (reify DeserializationSchema
                                 (deserialize [_ message]
                                   (let [[hash t op & extra] (-> message String. (.split ","))
                                         args (doto (java.util.ArrayList.)
                                                    (.addAll (or extra [])))]
                                     (CommandEvent. hash (Long/parseLong t) op args)))
                                 (isEndOfStream [_ _] false)
                                 (getProducedType [_] (TypeInformation/of (class CommandEvent))))]
    (RMQSource. config queue use-correlation-id deserialization-schema)))

(defn build-rmq-sink
  [{:keys [amqp-uri queue]}]
  (let [config (-> (RMQConnectionConfig$Builder.)
                   (.setUri amqp-uri)
                   .build)
        serialization-schema (reify SerializationSchema
                               (serialize [_ event]
                                 (-> event .toString .getBytes)))]
    (RMQSink. config queue serialization-schema)))

(defn- get-queue-provider-creds []
  {:topic (or (System/getenv "QUEUE_PROVIDER_TOPIC")
              (throw (Exception. "QUEUE_PROVIDER_TOPIC environment variable must be provided")))
   :username (or (System/getenv "QUEUE_PROVIDER_USERNAME")
                 (throw (Exception. "QUEUE_PROVIDER_USERNAME environment variable must be provided")))
   :password (or (System/getenv "QUEUE_PROVIDER_PASSWORD")
                 (throw (Exception. "QUEUE_PROVIDER_PASSWORD environment variable must be provided")))})

(defn -main [& args]
  (let [flink-env (doto (StreamExecutionEnvironment/getExecutionEnvironment)
                        (.enableCheckpointing 300000)
                        (.setParallelism 8)
                        (#(doto (.getCheckpointConfig %)
                                (.setCheckpointingMode CheckpointingMode/EXACTLY_ONCE)
                                (.setMinPauseBetweenCheckpoints 60000)
                                (.setCheckpointTimeout 300000)
                                (.setMaxConcurrentCheckpoints 1)
                                (.enableExternalizedCheckpoints CheckpointConfig$ExternalizedCheckpointCleanup/RETAIN_ON_CANCELLATION))))

        notifications-stream (-> flink-env
                                 (.fromSource (build-kafka-source (get-queue-provider-creds))
                                              (WatermarkStrategy/noWatermarks)
                                              "Notifications Stream | Kafka Source")
                                 (.uid "a604e4cd-5247-4f8d-8255-d9e3c036622e"))
        amqp-opts {:amqp-uri (or (System/getenv "AMQP_URI") "amqp://rabbitmq.ton.events")
                   :queue "ton.events.control"}
        hash-selector (reify StringKeySelector
                        (getKey [_ event] (.getHash event)))
        control-stream (-> flink-env
                           (.addSource (build-rmq-source amqp-opts)
                                       "Control Stream | RabbitMQ Source")
                           (.uid "9efee4c9-788c-43d8-8793-1d7adcac6be9"))
        combined-stream (-> (.connect control-stream notifications-stream)
                            (.keyBy hash-selector hash-selector)
                            (.process (SubscriptionsWiseNotificationsProcessor.))
                            (.uid "ee973088-68b8-490a-b9c4-bdb9992daeb5"))
        async-stream (-> (AsyncDataStream/unorderedWait combined-stream
                                                        (HttpNotificationSender.)
                                                        ; TODO: tune it in production
                                                        1 java.util.concurrent.TimeUnit/HOURS)
                         (.uid "2c988d3b-d6f8-4155-9f8f-a2acf5431e60")
                         (.addSink (build-rmq-sink amqp-opts))
                         (.name "Control Stream | RMQ Sink"))]

    (.execute flink-env "ton.events")))

