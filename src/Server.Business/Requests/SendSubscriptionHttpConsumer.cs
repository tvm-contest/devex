using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;

namespace Server.Requests
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
            var clientInfo = context.Headers.Get<ClientInfo>("clientInfo");
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.IsHttpEndpoint(clientInfo.Endpoint)) return;

            var consumerResponse = await _httpClient.PostAsync(clientInfo.Endpoint, new StringContent(message.ToClientString()), cancellationToken);
            consumerResponse.EnsureSuccessStatusCode();
        }
    }
}