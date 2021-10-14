using System.Collections.Generic;
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
            var contextMessage = context.Message;
            if (contextMessage.EndpointType != EndpointType.Http) return;

            var cancellationToken = context.CancellationToken;

            var endpoint = HttpEndpoint.FromPublishMessage(contextMessage);
            var method = GetMethodByParameters(contextMessage.Parameters);
            var request = new HttpRequestMessage(method, endpoint.Url) {
                Content = new StringContent(contextMessage.Message.Text)
            };
            var response = await _httpClient.SendAsync(request, cancellationToken);
            response.EnsureSuccessStatusCode();
        }

        private static HttpMethod GetMethodByParameters(IReadOnlyDictionary<string, string> parameters) {
            if (parameters.TryGetValue("m", out var method))
                return method.ToUpper() switch {
                    "GET" => HttpMethod.Get,
                    "PUT" => HttpMethod.Put,
                    _ => HttpMethod.Post
                };
            return HttpMethod.Post;
        }
    }

    public class
        PublishMessageHttpConsumerDefinition : PublishMessageConsumerDefinitionBase<PublishMessageHttpConsumer> {
        public PublishMessageHttpConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) : base(
            retryPolicyOptionsAccessor) { }
    }
}