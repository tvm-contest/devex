namespace Server.Models
{
    public interface SubscriptionMessage
    {
        string Text { get; }
        bool IsEncrypted { get; }
    }
}