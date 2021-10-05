namespace Server.Notifications
{
    public interface SendSubscription
    {
        string ClientId { get; }
        SubscriptionMessage Message { get; set; }
    }

    public interface SubscriptionMessage
    {
        string Text { get; }
    }

    public class EncryptedMessage : SubscriptionMessage
    {
        public EncryptedMessage(string nonce, string message)
        {
            Nonce = nonce;
            Message = message;
        }

        public EncryptedMessage(string message)
        {
            var split = message.Split(' ', 2);
            Nonce = split[0];
            Message = split[1];
        }

        public string Nonce { get; }
        public string Message { get; }

        public string Text => $"{Nonce} {Message}";
    }

    public class DecryptedMessage : SubscriptionMessage
    {
        public string Text { get; init; }
    }
}