namespace Server.Models {
    public class DecryptedMessage : SubscriptionMessage {
        public bool IsEncrypted => false;
        public string Text { get; init; }
    }
}