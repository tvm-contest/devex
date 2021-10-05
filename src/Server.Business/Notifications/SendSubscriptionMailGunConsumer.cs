using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Net.Http.Json;
using System.Text;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Serialization;
using Flurl;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Server.Options;

namespace Server.Notifications
{
    public class SendSubscriptionMailgunConsumer : IConsumer<SendSubscription>
    {
        private const string ApiUrl = "https://api.mailgun.net/v3";
        private readonly HttpClient _httpClient;
        private readonly ILogger<SendSubscriptionMailgunConsumer> _logger;
        private readonly MailGunOptions _mailGunOptions;

        public SendSubscriptionMailgunConsumer(HttpClient httpClient, ILogger<SendSubscriptionMailgunConsumer> logger,
            IOptions<MailGunOptions> mailGunOptionsAccessor)
        {
            _httpClient = httpClient;
            _logger = logger;
            _mailGunOptions = mailGunOptionsAccessor.Value;
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue(AuthenticationSchemes.Basic.ToString(),
                    Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{_mailGunOptions.ApiKey}")));
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var message = context.Message.Message.Text;
            var endpoint = context.Headers.Get<ClientInfo>(typeof(ClientInfo).FullName).Endpoint;
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.IsEmailEndpoint(endpoint)) return;

            var url = Url.Combine(ApiUrl, _mailGunOptions.Domain, "messages");
            var request = new FormUrlEncodedContent(new[]
            {
                KeyValuePair.Create("from", _mailGunOptions.From),
                KeyValuePair.Create("subject", _mailGunOptions.Subject),
                KeyValuePair.Create("to", endpoint),
                KeyValuePair.Create("text", message)
            });

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint, message);
            var response = await _httpClient.PostAsync(url, request, cancellationToken);
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
                        { "endpoint", url },
                        { "request", request },
                        { "response", failedResponseJson }
                    }
                };
            }

            var successResponseJson = await response.Content.ReadFromJsonAsync<JsonElement>(cancellationToken: cancellationToken);
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint, message, successResponseJson);
        }
    }

    public class SendSubscriptionMailgunConsumerDefinition : ConsumerDefinition<SendSubscriptionMailgunConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendSubscriptionMailgunConsumer> e)
        {
            e.UseDelayedRedelivery(HttpRetryPolicy.ConfigureHttpRetry);
        }
    }
}