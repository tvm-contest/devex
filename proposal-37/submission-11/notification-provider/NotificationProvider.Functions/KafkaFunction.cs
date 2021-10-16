using System;
using System.Threading.Tasks;
using Microsoft.Azure.WebJobs;
using Microsoft.Extensions.Logging;
using Microsoft.Azure.WebJobs.Extensions.Kafka;
using NotificationProvider.Functions.Extensions;
using NotificationProvider.Functions.Enteties;
using System.Linq;
using Polly;
using System.Net.Http;
using System.Text;

namespace NotificationProvider.Functions
{
    public class KafkaFunction
    {
        private readonly TableClient<EventReceiver> _eventReceivers;
        private readonly TableClient<KafkaMessage> _kafkaMessages;
        private readonly IHttpClientFactory _httpClientFactory;

        public KafkaFunction(
            TableClient<EventReceiver> eventReceivers,
            TableClient<KafkaMessage> kafkaMessages,
            IHttpClientFactory httpClientFactory)
        {
            _eventReceivers = eventReceivers;
            _kafkaMessages = kafkaMessages;
            _httpClientFactory = httpClientFactory;
        }

        [FunctionName("KafkaFunction")]
        public async Task Kafka(
            [KafkaTrigger(
                    "notification.services.tonlabs.io:29092",
                    "notifications-9",
                    ConsumerGroup = "$Default",
                    Protocol = BrokerProtocol.SaslPlaintext,
                    AuthenticationMode = BrokerAuthenticationMode.ScramSha512,
                    Username = "imsg",
                    Password = "%KAFKA_PASS%")]
            KafkaEventData<string> kafkaEvent, ILogger log)
        {
            var hash = string.Empty;
            var nonce = string.Empty;
            var encrypted = string.Empty;

            try
            {
                var input = kafkaEvent.Value.Split(' ');
                hash = input[0];
                nonce = input[1].Base64ToHex();
                encrypted = input[2];
                var eventReceiver = _eventReceivers
                    .Query<EventReceiver>($"PartitionKey eq '{hash}'")
                    .Single();

                if (eventReceiver.Url != "https://freeton.org" && !eventReceiver.IsVerified)
                    return;

                var context = new Context().WithLogger(log);
                var client = _httpClientFactory.CreateClient("pollyClient");
                var request = new HttpRequestMessage(HttpMethod.Post, eventReceiver.Url);
                request.Content = new StringContent(encrypted, Encoding.UTF8, "text/plain");
                request.SetPolicyExecutionContext(context);
                var response = await client.SendAsync(request);
                log.LogInformation(nameof(Kafka), new[] { new { hash, statusCode = response.StatusCode } });
                await _kafkaMessages.AddEntityAsync(new KafkaMessage
                {
                    PartitionKey = hash,
                    RowKey = hash,
                    Nonce = nonce,
                    Encrypted = encrypted
                });
            }
            catch (Exception ex)
            {
                log.LogError(
                    ex,
                    nameof(Kafka),
                    new[] { new
                    {
                        hash,
                        nonce,
                        encrypted
                    } });
                throw;
            }
        }
    }
}
