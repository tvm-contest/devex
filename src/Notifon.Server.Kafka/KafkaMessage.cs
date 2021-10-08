namespace Notifon.Server.Kafka {
    public class KafkaMessage {
        public string Key { get; set; }
        public string Hash { get; init; }
        public string Nonce { get; init; }
        public string EncodedMessage { get; init; }
    }
}