namespace Server.Requests
{
    public static class SendSubscriptionExtensions
    {
        public static string ToClientString(this SendSubscription sendSubscriptionMessage)
        {
            return $"{sendSubscriptionMessage.Nonce} {sendSubscriptionMessage.EncodedMessage}";
        }
    }
}