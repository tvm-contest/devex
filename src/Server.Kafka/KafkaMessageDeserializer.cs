using System;
using System.IO;
using Confluent.Kafka;

namespace Server.Kafka
{
    public class KafkaMessageDeserializer : IDeserializer<KafkaMessage>
    {
        public KafkaMessage Deserialize(ReadOnlySpan<byte> data, bool isNull, SerializationContext context)
        {
            using var stream = new MemoryStream(data.ToArray());
            using var reader = new StreamReader(stream);

            var value = reader.ReadToEnd().Split(' ');

            return new KafkaMessage { Hash = value[0], Nonce = value[1], EncodedMessage = value[2] };
        }
    }
}