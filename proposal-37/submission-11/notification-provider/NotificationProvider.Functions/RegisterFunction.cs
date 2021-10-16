using System;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Microsoft.AspNetCore.Http;
using Microsoft.Azure.WebJobs.Extensions.Http;
using System.Web;
using Azure.Data.Tables;
using NotificationProvider.Functions.Enteties;
using System.Linq;
using NotificationProvider.Functions.Extensions;

namespace NotificationProvider.Functions
{
    public class RegisterFunction
    {
        private readonly TableClient<EventReceiver> _eventReceivers;

        public RegisterFunction(TableClient<EventReceiver> eventReceivers)
        {
            _eventReceivers = eventReceivers;
        }

        [FunctionName("send-event")]
        public async Task<IActionResult> Register(
            [HttpTrigger(AuthorizationLevel.Anonymous, "post")] HttpRequest req, ILogger log)
        {
            var query = string.Empty;

            try
            {
                var responseMessage = string.Empty;
                var token = Guid.NewGuid().ToString().Replace("-", "");
                query = await req.ReadAsStringAsync();
                var queryString = HttpUtility.ParseQueryString(query);
                var hash = queryString["hash"];
                var url = queryString["data"].Base64ToUtf8();
                log.LogInformation(
                    nameof(Register),
                    new[] { new
                    {
                        hash,
                        url,
                        token
                    } });

                if (!Uri.TryCreate(url, UriKind.Absolute, out Uri _))
                    return new OkObjectResult("Please provide absolute URL.");

                var entity = _eventReceivers
                    .Query<EventReceiver>($"PartitionKey eq '{hash }'")
                    .SingleOrDefault();

                if (entity == null)
                {
                    var response = await _eventReceivers.AddEntityAsync(new EventReceiver
                    {
                        PartitionKey = hash,
                        RowKey = hash,
                        Url = url,
                        Token = token
                    });
                    responseMessage += $"URL '{url}' successfully added.\n\n";
                }
                else if (entity.Url != url)
                {
                    entity.Url = url;
                    entity.IsVerified = false;
                    entity.Token = token;
                    var response = await _eventReceivers.UpdateEntityAsync(entity, entity.ETag);
                    responseMessage += "URL '{url}' successfully updated.\n\n";
                }

                if (entity == null || !entity.IsVerified)
                    responseMessage += 
                        $"Your token is: {token}\n\n" +

                        $"Please confirm ownership of entered domain.\n" +
                        $"You can verify it with one of the options:\n" +
                        $" - respond to HTTP GET request with a token\n" +
                        $" - add token TXT record to your DNS configuration with\n\n" +

                        $"After you will complete this step you can " +
                        $"proceed with domain verification by navigating " +
                        $"to: https://ton.azurewebsites.net/api/verify/{token}\n\n";

                return new OkObjectResult(responseMessage);
            }
            catch (Exception ex)
            {
                log.LogError(
                    ex,
                    nameof(Register),
                    new[] { new
                    {
                        query
                    } });
                throw;
            }
        }
    }
}
