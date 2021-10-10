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
        private readonly IOptions<MailGunOptions> _mailGunOptionsAccessor;

        public PublishMessageMailgunConsumer(HttpClient httpClient, ILogger<PublishMessageMailgunConsumer> logger,
            IOptions<MailGunOptions> mailGunOptionsAccessor) {
            _httpClient = httpClient;
            _logger = logger;
            _mailGunOptionsAccessor = mailGunOptionsAccessor;
        }

        public async Task Consume(ConsumeContext<PublishMessage> context) {
            if (context.Message.EndpointType != EndpointType.Mailgun) return;

            var cancellationToken = context.CancellationToken;
            var parameters = MailgunParameters.Create(context.Message, () => _mailGunOptionsAccessor.Value);

            var url = Url.Combine(ApiUrl, parameters.Domain, "messages");

            var request = new FormUrlEncodedContent(new[] {
                KeyValuePair.Create("to", parameters.To),
                KeyValuePair.Create("from", parameters.From),
                KeyValuePair.Create("subject", parameters.Subject),
                KeyValuePair.Create("text", parameters.Text)
            });
            _httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue(AuthenticationSchemes.Basic.ToString(),
                Convert.ToBase64String(Encoding.ASCII.GetBytes($"api:{parameters.ApiKey}")));

            var response = await _httpClient.PostAsync(url, request, cancellationToken);
            response.EnsureSuccessStatusCode();
        }
    }

    public class PublishMessageMailgunConsumerDefinition : PublishMessageConsumerDefinitionBase<PublishMessageMailgunConsumer> {
        public PublishMessageMailgunConsumerDefinition(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) :
            base(retryPolicyOptionsAccessor) { }
    }
}