using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
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
            var response = await _httpClient.PostAsync(endpoint.Url, request, cancellationToken);
            response.EnsureSuccessStatusCode();
        }
    }

    public class
        PublishMessageHttpConsumerDefinition : PublishMessageConsumerDefinitionBase<PublishMessageHttpConsumer> {
        public PublishMessageHttpConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) : base(
            retryPolicyOptionsAccessor) { }
    }
}