using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageTelegramConsumer : IConsumer<PublishMessage> {
        private static string _botToken;
        private readonly HttpClient _httpClient;
        private readonly ILogger<PublishMessageTelegramConsumer> _logger;

        public PublishMessageTelegramConsumer(HttpClient httpClient, ILogger<PublishMessageTelegramConsumer> logger,
            IConfiguration configuration) {
            _httpClient = httpClient;
            _logger = logger;
            _botToken = configuration.GetValue<string>("TelegramOptions:BotToken");
        }

        private static string SendMessageUrl => $"https://api.telegram.org/bot{_botToken}/sendMessage";

        public async Task Consume(ConsumeContext<PublishMessage> context) {
            if (context.Message.EndpointType != EndpointType.Telegram) return;

            var message = context.Message.Message.Text;
            var cancellationToken = context.CancellationToken;
            var endpoint = TelegramEndpoint.FromPublishMessage(context.Message);

            var request = new { chat_id = $"@{endpoint.ChannelId}", text = message };

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint.ChannelId, message);
            var response = await _httpClient.PostAsJsonAsync(SendMessageUrl, request, cancellationToken);
            try {
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e) when (!e.Message.StartsWith("Too Many Requests")
                                                 && e.StatusCode >= (HttpStatusCode?)400
                                                 && e.StatusCode <= (HttpStatusCode?)499) {
                var failedResponse = await response.Content.ReadAsStringAsync(cancellationToken);
                throw new HttpRequestException(failedResponse, null,
                    HttpStatusCode.BadRequest) {
                    Data = {
                        { "endpoint", endpoint },
                        { "request", request },
                        { "response", failedResponse }
                    }
                };
            }

            var successResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint.ChannelId, message,
                successResponse);
        }
    }

    public class SendSubscriptionTelegramConsumerDefinition : SendSubscriptionConsumerDefinitionBase<
        PublishMessageTelegramConsumer> {
        public SendSubscriptionTelegramConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) :
            base(
                retryPolicyOptionsAccessor) { }
    }
}