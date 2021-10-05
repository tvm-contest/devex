using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Serialization;
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
            var endpoint = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).Endpoint;
            var messageText = context.Message.Message.Text;
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.IsHttpEndpoint(endpoint)) return;

            var request = new StringContent(messageText);

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint, messageText);
            var response = await _httpClient.PostAsync(endpoint, request, cancellationToken);
            try
            {
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e) when (e.StatusCode >= (HttpStatusCode?)400 && e.StatusCode <= (HttpStatusCode?)499)
            {
                var failedResponseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                throw new HttpRequestException(failedResponseJson.Get<string>("description"), null, HttpStatusCode.BadRequest)
                {
                    Data =
                    {
                        { "endpoint", endpoint },
                        { "request", request },
                        { "response", failedResponseJson }
                    }
                };
            }

            var successResponseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint, messageText, successResponseJson);
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