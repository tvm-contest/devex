using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;

namespace Server.Notifications
{
    public class SendSubscriptionHttpConsumer : IConsumer<SendSubscription>
    {
        private readonly HttpClient _httpClient;

        public SendSubscriptionHttpConsumer(HttpClient httpClient)
        {
            _httpClient = httpClient;
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var message = context.Message;
            var clientEndpoint = context.Headers.Get<string>("clientEndpoint");
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.IsHttpEndpoint(clientEndpoint)) return;

            var consumerResponse = await _httpClient.PostAsync(clientEndpoint, new StringContent(message.ToClientString()), cancellationToken);
            consumerResponse.EnsureSuccessStatusCode();
        }
    }
}