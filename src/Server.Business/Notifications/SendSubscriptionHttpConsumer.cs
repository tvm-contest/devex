using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Microsoft.Extensions.Logging;

namespace Server.Notifications
{
    public class SendSubscriptionHttpConsumer : IConsumer<SendSubscription>
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SendSubscriptionHttpConsumer> _logger;

        public SendSubscriptionHttpConsumer(HttpClient httpClient, ILogger<SendSubscriptionHttpConsumer> logger)
        {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var message = context.Message;
            var endpoint = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).Endpoint;
            var messageText = message.Message.Text;
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.IsHttpEndpoint(endpoint)) return;

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint, messageText);
            var consumerResponse = await _httpClient.PostAsync(endpoint, new StringContent(messageText), cancellationToken);
            consumerResponse.EnsureSuccessStatusCode();
        }
    }

    public class SendSubscriptionHttpConsumerDefinition : ConsumerDefinition<SendSubscriptionHttpConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendSubscriptionHttpConsumer> e)
        {
            e.UseDelayedRedelivery(HttpRetryPolicy.ConfigureHttpRetry);
        }
    }
}