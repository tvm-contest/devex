using System.Threading.Tasks;
using Server.Notifications;

namespace Server
{
    public interface IMessageDecryptor
    {
        Task<DecryptedMessage> Decrypt(EncryptedMessage encryptedMessage, string secretKey);
    }
}