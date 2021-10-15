package org.apache.flink.java;

import org.apache.flink.streaming.api.functions.co.CoProcessFunction;
import org.apache.flink.metrics.Counter;
import org.apache.flink.metrics.Meter;
import org.apache.flink.api.common.state.ValueState;
import org.apache.flink.api.common.state.MapState;
import org.apache.flink.clojure.dto.SubscriptionEvent;
import org.apache.flink.clojure.dto.QueueProviderEvent;
import org.apache.flink.clojure.dto.NotificationEvent;

/**
 * CoProcessFunctionBase
 */
public abstract class CoProcessFunctionBase extends CoProcessFunction<SubscriptionEvent, QueueProviderEvent, NotificationEvent> {
    protected transient ValueState<String> secret;
    protected transient ValueState<UniqueStrings> subscriptions;
    protected transient MapState<String, Long> notifications;
    protected transient Counter usersCounter;
    protected transient Counter subscriptionsCounter;
    protected transient Meter undeliverableNotificationsMeter;
}

