namespace Notifon.Server.Models {
    public interface SubscriptionMessage {
        string Text { get; }
        SubscriptionMessageType MessageType { get; }
    }
}