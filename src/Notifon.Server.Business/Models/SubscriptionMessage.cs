namespace Notifon.Server.Business.Models {
    public interface SubscriptionMessage {
        string Text { get; }
        bool IsEncrypted { get; }
    }
}