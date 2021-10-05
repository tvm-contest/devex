using Server.Models;

namespace Server.Requests.SendSubscription
{
    public interface DecryptEncryptedMessage
    {
        EncryptedMessage EncryptedMessage { get; set; }
        string SecretKey { get; set; }
    }
}