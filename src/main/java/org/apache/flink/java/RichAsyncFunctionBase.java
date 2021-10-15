package org.apache.flink.java;

import org.apache.flink.streaming.api.functions.async.RichAsyncFunction;
import org.apache.flink.util.concurrent.ScheduledExecutor;
import org.apache.flink.metrics.Meter;
import org.apache.flink.clojure.dto.NotificationEvent;
import org.apache.flink.clojure.dto.CommandEvent;

/**
 * RichAsyncFunctionBase
 */
public abstract class RichAsyncFunctionBase extends RichAsyncFunction<NotificationEvent, CommandEvent> {
    protected transient ScheduledExecutor executor;
    protected transient Meter deliveredNotificationsMeter;
    protected transient Meter undeliveredNotificationsMeter;
}

