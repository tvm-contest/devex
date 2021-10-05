namespace Server.Notifications
{
    public interface SendSubscription
    {
        string Hash { get; }
        string Nonce { get; }
        string EncodedMessage { get; }
    }
}