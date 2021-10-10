using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Notifon.Server.Business.Models;
using Notifon.Server.Business.Requests.TonClient;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageDecryptMessageFilter<T> : IFilter<PublishContext<T>> where T : class {
        private readonly IRequestClient<DecryptEncryptedMessage> _decryptMessageClient;
        private readonly IRequestClient<FormatDecryptedMessage> _formatMessageClient;

        public PublishMessageDecryptMessageFilter(IRequestClient<DecryptEncryptedMessage> decryptMessageClient,
            IRequestClient<FormatDecryptedMessage> formatMessageClient) {
            _decryptMessageClient = decryptMessageClient;
            _formatMessageClient = formatMessageClient;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next) {
            if (context.Message is PublishMessage publishMessage) {
                var secretKey = publishMessage.SecretKey;
                if (secretKey != null && TryGetDecryptParameter(publishMessage, out var decryptFormat)) {
                    var encryptedMessage = EncryptedMessage.CreateFromBase(publishMessage.Message);
                    var decryptedResponse = await _decryptMessageClient.GetResponse<DecryptedMessage>(new {
                        EncryptedMessage = encryptedMessage,
                        SecretKey = secretKey
                    });

                    if (decryptFormat != null) {
                        var formattedResponse = await _formatMessageClient.GetResponse<FormattedMessage, DummyResponse>(new {
                            DecryptedMessage = decryptedResponse.Message,
                            Format = decryptFormat
                        });
                        if (formattedResponse.Is(out Response<FormattedMessage> response)) publishMessage.Message = response.Message;
                    }
                    else {
                        publishMessage.Message = decryptedResponse.Message;
                    }

                    context.AddOrUpdatePayload(() => publishMessage, _ => publishMessage);
                }
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context) {
            context.CreateFilterScope("decrypt");
        }

        private static bool TryGetDecryptParameter(PublishMessage message, out string decryptFormat) {
            if (message.Parameters.TryGetValue("d", out var format)) {
                decryptFormat = format;
                return true;
            }

            decryptFormat = null;
            return false;
        }
    }
}