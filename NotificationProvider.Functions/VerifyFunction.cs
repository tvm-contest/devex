using System;
using System.Collections.Generic;
using System.Linq;
using System.Net;
using System.Net.Http;
using System.Text;
using System.Threading.Tasks;
using Azure.Data.Tables;
using DnsClient;
using Microsoft.AspNetCore.Http;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Azure.WebJobs;
using Microsoft.Azure.WebJobs.Extensions.Http;
using Microsoft.Extensions.Logging;
using NotificationProvider.Functions.Enteties;

namespace NotificationProvider.Functions
{
    public class VerifyFunction
    {
        private readonly TableClient<EventReceiver> _eventReceivers;

        public VerifyFunction(TableClient<EventReceiver> eventReceivers)
        {
            _eventReceivers = eventReceivers;
        }

        [FunctionName("verify")]
        public async Task<IActionResult> Verify(
            [HttpTrigger(AuthorizationLevel.Anonymous, "get", Route = "verify/{token}")] HttpRequest req,
            string token,
            ILogger log)
        {
            try
            {
                log.LogInformation(nameof(Verify), new[] { new { token } });
                var httpClient = new HttpClient();
                var eventReceiver = _eventReceivers
                    .Query<EventReceiver>($"Token eq '{token}'")
                    .Single();

                if (eventReceiver.IsVerified)
                    return new OkObjectResult("This domain already was verified");

                var verifiers = new Func<Task<bool>>[]
                {
                    async () =>
                    {
                        var response = await httpClient.GetAsync(eventReceiver.Url);
                        var content = await response.Content.ReadAsStringAsync();

                        return response.StatusCode == HttpStatusCode.OK
                            && content == token;
                    },
                    async () =>
                    {
                        var uri = new Uri(eventReceiver.Url);
                        var lookup = new LookupClient(new[]
                        {
                            IPAddress.Parse("8.8.8.8")
                        });

                        return (await lookup
                            .QueryAsync(uri.Host, QueryType.TXT, QueryClass.IN))
                            .Answers
                            .TxtRecords()
                            .Any(x => x.Text.Any(t => t == token));
                    }
                };

                return new OkObjectResult(await Verify(eventReceiver, verifiers));
            }
            catch (Exception ex)
            {
                log.LogError(
                    ex,
                    nameof(Verify),
                    new[] { new
                    {
                        token
                    } });
                throw;
            }
        }

        private async Task<string> Verify(
            EventReceiver eventReceiver,
            params Func<Task<bool>>[] verifiers)
        {
            foreach (var verify in verifiers)
            {
                if (await verify())
                {
                    eventReceiver.IsVerified = true;
                    var response = await _eventReceivers
                        .UpdateEntityAsync(eventReceiver, eventReceiver.ETag);

                    return "Your domain now is verified.";
                }
            }
            return "We could't verify you. Please reconfigure your endpoint and try again.";
        }
    }
}
