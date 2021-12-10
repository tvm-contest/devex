(ns org.apache.flink.clojure.dto
  (:use [clojure.string :only [join]])
  (:require [clj-bean.core :refer :all]))

(defbean org.apache.flink.clojure.dto.CommandEventBase
  [[String hash]
   [Long timestamp]
   [String op]
   [java.util.ArrayList args]])

(gen-class
  :name org.apache.flink.clojure.dto.CommandEvent
  :extends org.apache.flink.clojure.dto.CommandEventBase
  :prefix "command-event-")

(defn command-event-toString [this]
  (join "," (concat [(.getHash this) (.getTimestamp this) (.getOp this)]
                    (.getArgs this))))

(defbean org.apache.flink.clojure.dto.SubscriptionEvent
  [[String hash]
   [String data]
   [String secret]
   [Long timestamp]])

(defbean org.apache.flink.clojure.dto.QueueProviderEvent
  [[String idempotencyKey]
   [String hash]
   [String nonce]
   [String encryptedMessage]
   [Long timestamp]])

(defbean org.apache.flink.clojure.dto.NotificationEvent
  [[String secret]
   [String url]
   [String hash]
   [String nonce]
   [String encodedMessage]])

