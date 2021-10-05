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
                var encryptedMessage = new EncryptedMessage(sendSubscription.Message.Text);
                var clientInfo = context.Headers.Get<ClientInfo>("clientInfo");
                var decryptedMessage = await _decryptor.Decrypt(encryptedMessage, clientInfo.SecretKey);
                sendSubscription.Message = decryptedMessage;
                context.AddOrUpdatePayload(() => sendSubscription, _ => sendSubscription);
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
        }
    }
}