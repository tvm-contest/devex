using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Serialization;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Notifications {
    public class PublishMessageHttpConsumer : IConsumer<PublishMessage> {
        private readonly HttpClient _httpClient;
        private readonly ILogger<PublishMessageHttpConsumer> _logger;

        public PublishMessageHttpConsumer(HttpClient httpClient, ILogger<PublishMessageHttpConsumer> logger) {
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<PublishMessage> context) {
            if (context.Message.EndpointType != EndpointType.Http) return;

            var endpoint = HttpEndpoint.FromPublishMessage(context.Message);
            var messageText = context.Message.Message.Text;
            var cancellationToken = context.CancellationToken;

            var request = new StringContent(messageText);

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint.Url, messageText);
            var response = await _httpClient.PostAsync(endpoint.Url, request, cancellationToken);
            try {
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e) when (e.StatusCode >= (HttpStatusCode?)400 &&
                                                 e.StatusCode <= (HttpStatusCode?)499) {
                var failedResponseJson =
                    await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
                throw new HttpRequestException(failedResponseJson.Get<string>("description"), null,
                    HttpStatusCode.BadRequest) {
                    Data = {
                        { "endpoint", endpoint },
                        { "request", request },
                        { "response", failedResponseJson }
                    }
                };
            }

            var successResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint.Url, messageText,
                successResponse);
        }
    }

    public class
        SendSubscriptionHttpConsumerDefinition : SendSubscriptionConsumerDefinitionBase<PublishMessageHttpConsumer> {
        public SendSubscriptionHttpConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) : base(
            retryPolicyOptionsAccessor) { }
    }
}