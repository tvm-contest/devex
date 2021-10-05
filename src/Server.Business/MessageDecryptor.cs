using System;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client.Models;
using Server.Notifications;

namespace Server
{
    public class MessageDecryptor : IMessageDecryptor
    {
        private const string ServerPublicKey = "a36bf515ee8de6b79d30b294bbe7162f5e2a45b95ea97e4baebab8873492ee43";

        private readonly ITonClient _tonClient;

        public MessageDecryptor(ITonClient tonClient)
        {
            _tonClient = tonClient;
        }

        public async Task<DecryptedMessage> Decrypt(EncryptedMessage encryptedMessage, string secretKey)
        {
            var result = await _tonClient.Crypto.NaclBoxOpen(new ParamsOfNaclBoxOpen
            {
                Encrypted = encryptedMessage.Message,
                Nonce = Convert.FromBase64String(encryptedMessage.Nonce).ToHexString(),
                Secret = secretKey,
                TheirPublic = ServerPublicKey
            });

            return new DecryptedMessage { Text = result.Decrypted.StringFromBase64() };
        }
    }
}