namespace Server.Notifications
{
    public interface SendSubscription
    {
        string ClientId { get; }
        string Nonce { get; }
        string EncodedMessage { get; }
    }
}