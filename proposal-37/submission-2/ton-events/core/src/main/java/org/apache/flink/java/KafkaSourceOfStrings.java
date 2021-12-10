package org.apache.flink.connector.kafka.source;

import org.apache.flink.connector.kafka.source.KafkaSource;
import org.apache.flink.connector.kafka.source.enumerator.subscriber.KafkaSubscriber;
import org.apache.flink.connector.kafka.source.enumerator.initializer.OffsetsInitializer;
import org.apache.flink.api.connector.source.Boundedness;
import org.apache.flink.connector.kafka.source.reader.deserializer.KafkaRecordDeserializationSchema;
import java.util.Properties;

import javax.annotation.Nullable;

/**
 * KafkaSourceOfStrings
 */
public class KafkaSourceOfStrings extends KafkaSource<String> {
    KafkaSourceOfStrings(
			KafkaSubscriber subscriber,
			OffsetsInitializer startingOffsetsInitializer,
			@Nullable OffsetsInitializer stoppingOffsetsInitializer,
			Boundedness boundedness,
			KafkaRecordDeserializationSchema<String> deserializationSchema,
			Properties props) {
        super(subscriber, startingOffsetsInitializer, stoppingOffsetsInitializer,
                boundedness, deserializationSchema, props);
    }
}

