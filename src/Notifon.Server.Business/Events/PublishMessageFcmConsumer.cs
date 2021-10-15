using System.Threading.Tasks;
using FirebaseAdmin.Messaging;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Exceptions;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageFcmConsumer : IConsumer<PublishMessage> {
        private readonly FirebaseMessaging _firebaseMessaging;
        private ILogger<PublishMessageFcmConsumer> _logger;

        public PublishMessageFcmConsumer(FirebaseMessaging firebaseMessaging, ILogger<PublishMessageFcmConsumer> logger) {
            _firebaseMessaging = firebaseMessaging;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<PublishMessage> context) {
            var contextMessage = context.Message;
            if (contextMessage.EndpointType != EndpointType.Fcm) return;

            var cancellationToken = context.CancellationToken;

            var endpoint = FcmEndpoint.FromPublishMessage(contextMessage);

            const string title = "Free TON Notification";
            var msg = new Message {
                Notification = new Notification {
                    Title = title,
                    Body = contextMessage.Message.Text
                },
                Token = endpoint.Token
            };
            if (_firebaseMessaging == null)
                throw new NoFirebaseMessagingException("No Firebase Messaging Instance. Make sure that file firebase-key.json exists");
            _logger.LogTrace("FCM Message {@Message}", msg);
            await _firebaseMessaging.SendAsync(msg, cancellationToken);
        }
    }

    public class
        PublishMessageFcmConsumerDefinition : PublishMessageConsumerDefinitionBase<PublishMessageFcmConsumer> {
        public PublishMessageFcmConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) : base(
            retryPolicyOptionsAccessor) { }
    }
}