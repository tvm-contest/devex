namespace NotificationProvider.Functions.Enteties
{
    public record EventReceiver : TableEntity
    {
        public string Url { get; set; }
        public string Token { get; set; }
        public bool IsVerified { get; set; }
    }
}
