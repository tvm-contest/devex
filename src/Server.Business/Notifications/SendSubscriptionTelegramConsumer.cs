using System.Net;
using System.Net.Http;
using System.Net.Http.Json;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Serialization;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Server.Notifications
{
    public class SendSubscriptionTelegramConsumer : IConsumer<SendSubscription>
    {
        private static string _botToken;
        private static readonly string SendMessageUrl = $"https://api.telegram.org/bot{_botToken}/sendMessage";
        private readonly HttpClient _httpClient;
        private readonly ILogger<SendSubscriptionTelegramConsumer> _logger;

        public SendSubscriptionTelegramConsumer(HttpClient httpClient, ILogger<SendSubscriptionTelegramConsumer> logger, IConfiguration configuration)
        {
            _httpClient = httpClient;
            _logger = logger;
            _botToken = configuration.GetValue<string>("TelegramBotToken");
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var message = context.Message.Message.Text;
            var endpoint = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).Endpoint;
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.TryGetTelegramEndpoint(endpoint, out var channel)) return;

            var telegramRequest = new { chat_id = $"@{channel}", text = message };

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint, message);
            var response = await _httpClient.PostAsJsonAsync(SendMessageUrl, telegramRequest, cancellationToken);
            var responseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            var resultPrototype = new { ok = default(bool), description = default(string) };
            var result = responseJson.ToAnonymous(resultPrototype);
            if (!result.ok)
                throw new HttpRequestException(result.description, null, HttpStatusCode.BadRequest)
                {
                    Data =
                    {
                        { "url", SendMessageUrl },
                        { "request", telegramRequest }
                    }
                };

            response.EnsureSuccessStatusCode();
        }
    }

    public class SendSubscriptionTelegramConsumerDefinition : ConsumerDefinition<SendSubscriptionTelegramConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendSubscriptionTelegramConsumer> e)
        {
            e.UseDelayedRedelivery(HttpRetryPolicy.ConfigureHttpRetry);
        }
    }
}