using System.Threading.Tasks;
using GreenPipes;
using MassTransit;

namespace Server.Notifications
{
    public class SendSubscriptionDecryptMessageFilter<T> : IFilter<PublishContext<T>> where T : class
    {
        private readonly IMessageDecryptor _decryptor;

        public SendSubscriptionDecryptMessageFilter(IMessageDecryptor decryptor)
        {
            _decryptor = decryptor;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next)
        {
            if (context.Message is SendSubscription sendSubscription)
            {
                var secretKey = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).SecretKey;
                if (secretKey != null)
                {
                    var encryptedMessage = EncryptedMessage.CreateFromMessage(sendSubscription.Message.Text);
                    var decryptedMessage = await _decryptor.Decrypt(encryptedMessage, secretKey);
                    sendSubscription.Message = decryptedMessage;
                    context.AddOrUpdatePayload(() => sendSubscription, _ => sendSubscription);
                }
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
        }
    }
}