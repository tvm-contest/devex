using System;
using System.Collections.Generic;
using System.Net;
using System.Net.Http;
using System.Net.Http.Headers;
using System.Text;
using System.Threading.Tasks;
using Flurl;
using MassTransit;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageMailgunConsumer : IConsumer<PublishMessage> {
        private const string ApiUrl = "https://api.mailgun.net/v3";
        private readonly HttpClient _httpClient;
        private readonly ILogger<PublishMessageMailgunConsumer> _logger;
        private readonly MailGunOptions _mailGunOptions;

        public PublishMessageMailgunConsumer(HttpClient httpClient, ILogger<PublishMessageMailgunConsumer> logger,
            IOptions<MailGunOptions> mailGunOptionsAccessor) {
            _httpClient = httpClient;
            _logger = logger;
            _mailGunOptions = mailGunOptionsAccessor.Value;
            _httpClient.DefaultRequestHeaders.Authorization =
                new AuthenticationHeaderValue(AuthenticationSchemes.Basic.ToString(),
                    Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{_mailGunOptions.ApiKey}")));
        }

        public async Task Consume(ConsumeContext<PublishMessage> context) {
            if (context.Message.EndpointType != EndpointType.Mailgun) return;

            var message = context.Message.Message.Text;
            var endpoint = MailgunEndpoint.FromPublishMessage(context.Message);
            var cancellationToken = context.CancellationToken;

            var url = Url.Combine(ApiUrl, _mailGunOptions.Domain, "messages");
            var request = new FormUrlEncodedContent(new[] {
                KeyValuePair.Create("to", endpoint.To),
                KeyValuePair.Create("from", _mailGunOptions.From),
                KeyValuePair.Create("subject", _mailGunOptions.Subject),
                KeyValuePair.Create("text", message)
            });

            _logger.LogTrace("Sending to {Endpoint} message {Message}", endpoint.To, message);
            var response = await _httpClient.PostAsync(url, request, cancellationToken);
            try {
                response.EnsureSuccessStatusCode();
            }
            catch (HttpRequestException e) when (e.StatusCode >= (HttpStatusCode?)400 &&
                                                 e.StatusCode <= (HttpStatusCode?)499) {
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
            _logger.LogTrace("Message sent to {Endpoint} message {Message} result {Result}", endpoint.To, message,
                successResponse);
        }
    }

    public class SendSubscriptionMailgunConsumerDefinition : SendSubscriptionConsumerDefinitionBase<PublishMessageMailgunConsumer> {
        public SendSubscriptionMailgunConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) :
            base(retryPolicyOptionsAccessor) { }
    }
}