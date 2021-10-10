using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class DecryptedMessage : SubscriptionMessage {
        public string Text { get; init; }
        public SubscriptionMessageType MessageType => SubscriptionMessageType.Decrypted;
    }
}