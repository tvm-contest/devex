namespace NotificationProvider.Functions.Enteties
{
    public record KafkaMessage : TableEntity
    {
        public string Nonce { get; set; }
        public string Encrypted { get; set; }
    }
}
