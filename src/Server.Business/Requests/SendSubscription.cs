namespace Server.Business.Requests
{
    public interface SendSubscription
    {
        string Hash { get; }
        string Nonce { get; }
        string EncodedMessage { get; }
    }
}