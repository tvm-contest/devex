(defproject ton-events "1.0.0-SNAPSHOT"
  :description "HTTP Notifications Provider for the Free TON network"
  :license {:name "GPL, Version 3.0"
            :url "https://www.gnu.org/licenses/gpl-3.0.txt"}
  :dependencies [[org.clojure/clojure "1.10.3"]
                 [org.clojure/data.codec "0.1.1"]
                 [org.apache.flink/flink-clients_2.12 "1.14.0"]
                 [org.apache.flink/flink-connector-kafka_2.12 "1.14.0"]
                 [org.apache.flink/flink-connector-rabbitmq_2.12 "1.14.0"]
                 [clj-http "3.12.3"]
                 [buddy/buddy-core "1.10.1"]
                 [com.wjoel/clj-bean "0.2.1"]]
  :source-paths ["src/main/clojure"]
  :java-source-paths ["src/main/java"]
  :test-paths ["src/test/clojure"]
  :resource-paths ["src/main/resource"]
  :prep-tasks [["compile" "org.apache.flink.clojure.dto"] "javac" "compile"]
  :aot [org.apache.flink.clojure.core]
  :main org.apache.flink.clojure.core)
