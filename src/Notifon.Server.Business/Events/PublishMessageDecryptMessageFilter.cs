using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Notifon.Server.Business.Models;
using Notifon.Server.Business.Requests.TonClient;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageDecryptMessageFilter<T> : IFilter<PublishContext<T>> where T : class {
        private readonly IRequestClient<DecryptEncryptedMessage> _decryptMessageClient;

        public PublishMessageDecryptMessageFilter(IRequestClient<DecryptEncryptedMessage> decryptMessageClient) {
            _decryptMessageClient = decryptMessageClient;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next) {
            if (context.Message is PublishMessage publishMessage) {
                var secretKey = publishMessage.SecretKey;
                if (secretKey != null && publishMessage.ContainsDecryptParameter()) {
                    var encryptedMessage = EncryptedMessage.CreateFromBase(publishMessage.Message);
                    var decryptedMessage = await _decryptMessageClient.GetResponse<DecryptedMessage>(new {
                        EncryptedMessage = encryptedMessage,
                        SecretKey = secretKey
                    });
                    publishMessage.Message = decryptedMessage.Message;
                    context.AddOrUpdatePayload(() => publishMessage, _ => publishMessage);
                }
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context) { }
    }
}