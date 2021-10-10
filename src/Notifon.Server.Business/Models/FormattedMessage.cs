using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class FormattedMessage : SubscriptionMessage {
        public string Text { get; init; }
        public SubscriptionMessageType MessageType { get; } = SubscriptionMessageType.DecryptedFormatted;
    }
}