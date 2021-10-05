using Server.Models;

namespace Server.Requests.TonClient
{
    public interface DecryptEncryptedMessage
    {
        EncryptedMessage EncryptedMessage { get; set; }
        string SecretKey { get; set; }
    }
}