(ns org.apache.flink.clojure.impl
  (:require [clojure.data.codec.base64 :as b64]
            [clj-http.client :as http]
            [buddy.core.mac :as mac]
            [buddy.core.codecs :as codecs])
  (:use [clojure.string :only (split)])
  (:import (org.apache.flink.api.common.typeinfo TypeInformation)
           (org.apache.flink.api.common.state StateTtlConfig
                                              StateTtlConfig$UpdateType
                                              StateTtlConfig$StateVisibility)
           (org.apache.flink.api.common.time Time)
           (org.apache.flink.metrics MeterView)
           (org.apache.flink.java CoProcessFunctionBase
                                  UniqueStrings
                                  StringToLongMapStateDescriptor
                                  StringStateDescriptor
                                  UniqueStringsStateDescriptor)
           (org.apache.flink.util.concurrent FutureUtils
                                             ExponentialBackoffRetryStrategy
                                             ScheduledExecutorServiceAdapter)
           (java.util.concurrent Executors
                                 CompletableFuture)
           (org.apache.http HttpResponse)
           (org.apache.http.protocol HttpContext)
           (java.util.function Supplier
                               BiConsumer)
           (java.time Duration)
           (java.util Arrays
                      ArrayList
                      Collections)
           (java.io IOException)
           (org.apache.flink.clojure.dto NotificationEvent
                                         CommandEvent)))


(defn- env-to-long [{:keys [name default]}]
  (try (-> (System/getenv name)
           (Long/parseLong))
       (catch Exception e default)))


;;
;; SubscriptionsWiseNotificationsProcessor
;;
;; This is the place where the Control stream meets the QueueProvider stream:
;;
;; - receives commands
;; - receives encrypted notifications from the Queue Provider
;; - manages state needed for active subscriptions tracking and Queue Provider events deduplication
;; - emits notifications events to HTTP Notification Sending stream
;;
(gen-class
  :name SubscriptionsWiseNotificationsProcessor
  :extends org.apache.flink.java.CoProcessFunctionBase
  :implements [org.apache.flink.api.java.typeutils.ResultTypeQueryable]
  :exposes {secret {:get getSecret :set setSecret}
            subscriptions {:get getSubscriptions :set setSubscriptions}
            notifications {:get getNotifications :set setNotifications}
            usersCounter {:get getUsersCounter :set setUsersCounter}
            subscriptionsCounter {:get getSubscriptionsCounter :set setSubscriptionsCounter}
            undeliverableNotificationsMeter {:get getUndeliverableNotificationsMeter
                                             :set setUndeliverableNotificationsMeter}}
  :prefix "processor-")

(defn- enable-ttl
  [descriptor ttl update-type]
  (doto descriptor
    (.enableTimeToLive
      (-> (StateTtlConfig/newBuilder ttl)
          (.setUpdateType update-type)
          (.setStateVisibility StateTtlConfig$StateVisibility/NeverReturnExpired)
          .build))))

;;
;; Does state initialization work.
;;
(defn processor-open [this _]
  (let [ctx (.getRuntimeContext this)
        secret (-> (StringStateDescriptor. "secret")
                   (enable-ttl (Time/days 7)
                               (StateTtlConfig$UpdateType/OnReadAndWrite))
                   (#(.getState ctx %)))
        subscriptions (-> (UniqueStringsStateDescriptor. "subscriptions")
                          (enable-ttl (Time/days 7)
                                      (StateTtlConfig$UpdateType/OnReadAndWrite))
                          (#(.getState ctx %)))
        notifications (-> (StringToLongMapStateDescriptor. "notifications")
                          (enable-ttl (Time/minutes 60)
                                      (StateTtlConfig$UpdateType/OnCreateAndWrite))
                          (#(.getMapState ctx %)))]
    (.setSecret this secret)
    (.setSubscriptions this subscriptions)
    (.setNotifications this notifications)
    (.setUsersCounter this (-> ctx .getMetricGroup (.counter "users")))
    (.setSubscriptionsCounter this (-> ctx .getMetricGroup (.counter "subscriptions")))
    (.setUndeliverableNotificationsMeter
      this
      (-> ctx .getMetricGroup (.meter "undeliverable-notifications" (MeterView. 60))))))

;;
;; This is the place where commands from the Control stream are being processed.
;;
(defn processor-processElement1 [this event & _]
  (let [subscriptions (or (-> this .getSubscriptions .value) (UniqueStrings.))]
    (case (.getOp event)
      "add-subscription"
      (let [[data secret] (.getArgs event)]
        (when (-> this .getSecret .value nil?)
          (-> this .getUsersCounter .inc)) ; track first-time subscriptions, i.e. unique users
        (-> this .getSecret (.update secret))
        (when (.add subscriptions data)
          (-> this .getSubscriptionsCounter .inc) ; count unique subscriptions
          (-> this .getSubscriptions (.update subscriptions))))
      "remove-subscription"
      (let [[data] (.getArgs event)]
        (when (.remove subscriptions data)
          (-> this .getSubscriptionsCounter .dec)
          (-> this .getSubscriptions (.update subscriptions))))
      :noop)))

;;
;; Queue Provider events with no destination (e.g., unexisting or unresponsive) are being filtered out here.
;;
(defn processor-processElement2 [this event _ out]
  (let [subscriptions (-> this .getSubscriptions .value)]
    (if (seq subscriptions)
      (let [notifications-state (.getNotifications this)
            idempotency-key (.getIdempotencyKey event)]
        (if-let [n (-> notifications-state (.get idempotency-key))]
          (-> notifications-state (.put idempotency-key (inc n))) ; update it just to reset TTL
          (do (-> notifications-state (.put idempotency-key 1))
              (doseq [url subscriptions]
                (.collect out (NotificationEvent. (-> this .getSecret .value)
                                                  url
                                                  (.getHash event)
                                                  (.getNonce event)
                                                  (.getEncryptedMessage event)))))))
      (-> this .getUndeliverableNotificationsMeter .markEvent)))) ; track undeliverable notifications

(defn processor-getProducedType [_]
  (TypeInformation/of (class NotificationEvent)))

;;
;; All the code below could be simpler and more elegant if 'clj-http'
;; supported retries on failure for async requests (sync version does).
;; Things are gonna be like that until 'clj-http' relies on Apache's
;; HttpAsyncClient 4, which doesn't support request re-execution.
;;

;;
;; HttpNotificationSender
;;
;; - sends HTTP notifications
;; - retries on failure (with exponential backoff)
;; - removes hopeless subscriptions
;;
(gen-class
  :name HttpNotificationSender
  :extends org.apache.flink.java.RichAsyncFunctionBase
  :implements [org.apache.flink.api.java.typeutils.ResultTypeQueryable]
  :exposes {executor {:get getExecutor :set setExecutor}
            deliveredNotificationsMeter {:get getDeliveredNotificationsMeter
                                         :set setDeliveredNotificationsMeter}
            undeliveredNotificationsMeter {:get getUndeliveredNotificationsMeter
                                           :set setUndeliveredNotificationsMeter}}
  :prefix "sender-")

;;
;; send-http-notification
;;
;; Sends HTTP Notification:
;;
;; - builds proper body of 'nonce' and 'encryptedMessage'
;; - calculates body signature for integrity check header ('x-te-signature')
;; - considers any response status code but 200 an error
;;
(defn- send-http-notification [input]
  (let [url (-> input .getUrl .getBytes b64/decode (String. "UTF-8"))
        response (format "%s %s" (.getNonce input) (.getEncodedMessage input))
        secret (-> input .getSecret codecs/hex->bytes)
        signature (-> (mac/hash (str "hmacsha256=" response)
                                {:key secret :alg :hmac+sha256})
                      codecs/bytes->hex)
        throw-unless-200 (fn [^HttpResponse res ^HttpContext ctx]
                           (when-not (-> res .getStatusLine .getStatusCode (= 200))
                             (throw (IOException. "Not a droid you're looking for..."))))]
    (http/post url {:socket-timeout 60000
                    :connection-timeout 60000
                    :content-type "text/plain"
                    :headers {:x-te-signature signature}
                    :body response
                    :retry-handler (fn [& _] false)
                    :response-interceptor throw-unless-200})))

(defn sender-open [this _]
  (->> (Executors/newSingleThreadScheduledExecutor)
       ScheduledExecutorServiceAdapter.
       (.setExecutor this))
  (let [ctx (.getRuntimeContext this)]
    (.setDeliveredNotificationsMeter
      this
      (-> ctx .getMetricGroup (.meter "delivered-notifications" (MeterView. 60))))
    (.setUndeliveredNotificationsMeter
      this
      (-> ctx .getMetricGroup (.meter "undelivered-notifications" (MeterView. 60))))))

;;
;; Makes the whole stream non-blocking and allows sending HTTP notifications
;; to alive subscribers even when other subscribers are not so alive.
;;
;; Responsible for retries on failure of notification sending.
;;
(defn sender-asyncInvoke [this input result-future]
  (let [attempts (env-to-long {:name "RETRIABLE_NOTIFICATION_SENDING_ATTEMPTS" :default 3})
        initial-delay (env-to-long {:name "RETRIABLE_NOTIFICATION_SENDING_INITIAL_DELAY" :default 30})
        max-delay (env-to-long {:name "RETRIABLE_NOTIFICATION_SENDING_MAX_DELAY" :default 600})
        retriable-task (FutureUtils/retryWithDelay
                         (reify Supplier
                           (get [_] (try (do (send-http-notification input)
                                             (CompletableFuture/completedFuture nil))
                                         (catch Exception e (FutureUtils/completedExceptionally e)))))
                         (ExponentialBackoffRetryStrategy. attempts
                                                           (Duration/ofSeconds initial-delay)
                                                           (Duration/ofSeconds max-delay))
                         (.getExecutor this))]
    (.whenComplete retriable-task
                   (reify BiConsumer
                      (accept [_ _ throwable]
                        (if (nil? throwable)
                            (do (-> this
                                    .getDeliveredNotificationsMeter
                                    .markEvent) ; track delivered notifications
                                (.complete result-future (Collections/emptyList)))
                            (do (-> this
                                    .getUndeliveredNotificationsMeter
                                    .markEvent) ; track undelivered notifications, i.e. subscriptions removal
                                (->> (CommandEvent. (.getHash input)
                                                    (quot (System/currentTimeMillis) 1000)
                                                    "remove-subscription"
                                                    (-> input .getUrl vector ArrayList.))
                                     Collections/singletonList
                                     (.complete result-future)))))))))

(defn sender-getProducedType [_]
  (TypeInformation/of (class CommandEvent)))

