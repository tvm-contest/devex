namespace Server.Options {
    public class MailGunOptions {
        public string ApiKey { get; set; }
        public string Domain { get; set; }
        public string From { get; set; }
        public string Subject { get; set; } = "Notification DeBot subscription";
    }
}