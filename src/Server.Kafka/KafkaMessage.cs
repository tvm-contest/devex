namespace Server.Kafka
{
    public class KafkaMessage
    {
        public string Hash { get; init; }
        public string Nonce { get; init; }
        public string EncodedMessage { get; init; }
    }
}