using System;
using System.IO;
using Confluent.Kafka;

namespace Server.KafkaMessage {
    public class KafkaMessageDeserializer : IDeserializer<KafkaMessage> {
        public KafkaMessage Deserialize(ReadOnlySpan<byte> data, bool isNull, SerializationContext context) {
            using var stream = new MemoryStream(data.ToArray());
            using var reader = new StreamReader(stream);

            var value = reader.ReadToEnd().Split(' ');
            var (hash, nonce, encodedMessage) = (value[0], value[1], value[2]);

            return new KafkaMessage { Hash = hash, Nonce = nonce, EncodedMessage = encodedMessage };
        }
    }
}