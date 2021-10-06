namespace Notifon.Server.Business.Models {
    public class EncryptedMessage : SubscriptionMessage {
        public EncryptedMessage(string nonce, string message) {
            Nonce = nonce;
            Message = message;
            IsEncrypted = true;
        }

        public string Nonce { get; }
        public string Message { get; }
        public bool IsEncrypted { get; }
        public string Text => $"{Nonce} {Message}";

        public static EncryptedMessage CreateFromMessage(string nonceAndMessage) {
            var split = nonceAndMessage.Split(' ', 2);
            return new EncryptedMessage(split[0], split[1]);
        }
    }
}