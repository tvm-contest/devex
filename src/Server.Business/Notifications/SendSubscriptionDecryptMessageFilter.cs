using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Server.Models;
using Server.Requests.TonClient;

namespace Server.Notifications {
    public class SendSubscriptionDecryptMessageFilter<T> : IFilter<PublishContext<T>> where T : class {
        private readonly IRequestClient<DecryptEncryptedMessage> _decryptMessageClient;

        public SendSubscriptionDecryptMessageFilter(IRequestClient<DecryptEncryptedMessage> decryptMessageClient) {
            _decryptMessageClient = decryptMessageClient;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next) {
            if (context.Message is SendSubscription sendSubscription) {
                var secretKey = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).SecretKey;
                if (secretKey != null) {
                    var encryptedMessage = EncryptedMessage.CreateFromMessage(sendSubscription.Message.Text);
                    var decryptedMessage = await _decryptMessageClient.GetResponse<DecryptedMessage>(new {
                        EncryptedMessage = encryptedMessage,
                        SecretKey = secretKey
                    });
                    sendSubscription.Message = decryptedMessage.Message;
                    context.AddOrUpdatePayload(() => sendSubscription, _ => sendSubscription);
                }
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context) { }
    }
}