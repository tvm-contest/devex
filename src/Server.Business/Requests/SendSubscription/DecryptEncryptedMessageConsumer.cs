using System;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client.Models;
using MassTransit;
using Server.Models;

namespace Server.Requests.SendSubscription
{
    public class DecryptEncryptedMessageConsumer : IConsumer<DecryptEncryptedMessage>
    {
        private const string ServerPublicKey = "a36bf515ee8de6b79d30b294bbe7162f5e2a45b95ea97e4baebab8873492ee43";

        private readonly ITonClient _tonClient;

        public DecryptEncryptedMessageConsumer(ITonClient tonClient)
        {
            _tonClient = tonClient;
        }

        public async Task Consume(ConsumeContext<DecryptEncryptedMessage> context)
        {
            var encryptedMessage = context.Message.EncryptedMessage;
            var secretKey = context.Message.SecretKey;

            var result = await _tonClient.Crypto.NaclBoxOpen(new ParamsOfNaclBoxOpen
            {
                Encrypted = encryptedMessage.Message,
                Nonce = Convert.FromBase64String(encryptedMessage.Nonce).ToHexString(),
                Secret = secretKey,
                TheirPublic = ServerPublicKey
            });

            await context.RespondAsync<DecryptedMessage>(new
            {
                Text = result.Decrypted.StringFromBase64()
            });
        }
    }
}