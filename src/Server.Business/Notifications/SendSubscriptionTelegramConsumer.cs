using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Serialization;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Server.Options;

namespace Server.Notifications {
    public class SendSubscriptionTelegramConsumer : IConsumer<SendSubscription> {
        private static string _botToken;
        private readonly HttpClient _httpClient;
        private readonly ILogger<SendSubscriptionTelegramConsumer> _logger;

        public SendSubscriptionTelegramConsumer(HttpClient httpClient, ILogger<SendSubscriptionTelegramConsumer> logger,
            IConfiguration configuration) {
            _httpClient = httpClient;
            _logger = logger;
            _botToken = configuration.GetValue<string>("TelegramOptions:BotToken");
        }

        private static string SendMessageUrl => $"https://api.telegram.org/bot{_botToken}/sendMessage";

        public async Task Consume(ConsumeContext<SendSubscription> context) {
            var message = context.Message.Message.Text;
            var endpoint = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).Endpoint;
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.TryGetTelegramEndpoint(endpoint, out var channel)) return;

            var request = new { chat_id = $"@{channel}", text = message };

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint, message);
            var response = await _httpClient.PostAsJsonAsync(SendMessageUrl, request, cancellationToken);
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
                        { "endpoint", SendMessageUrl },
                        { "request", request },
                        { "response", failedResponseJson }
                    }
                };
            }

            var successResponse = await response.Content.ReadAsStringAsync(cancellationToken);
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint, message,
                successResponse);
        }
    }

    public class
        SendSubscriptionTelegramConsumerDefinition : SendSubscriptionConsumerDefinitionBase<
            SendSubscriptionTelegramConsumer> {
        public SendSubscriptionTelegramConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) :
            base(
                retryPolicyOptionsAccessor) { }
    }
}