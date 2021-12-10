using System;
using System.Net;
using System.Net.Http;
using Microsoft.Azure.Functions.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.DependencyInjection;
using Polly;
using Polly.Extensions.Http;
using NotificationProvider.Functions.Extensions;
using Azure.Data.Tables;
using NotificationProvider.Functions.Enteties;

[assembly: FunctionsStartup(typeof(NotificationProvider.Functions.Startup))]
namespace NotificationProvider.Functions
{
    public class Startup : FunctionsStartup
    {
        public override void Configure(IFunctionsHostBuilder builder)
        {
            builder.Services.AddLogging();
            builder.Services.AddHttpClient("pollyClient").AddPolicyHandler(GetRetryPolicy());

            var connectionString = Environment.GetEnvironmentVariable("AzureTableStorage_ConnectionString");
            var eventReceivers = new TableClient<EventReceiver>(connectionString);
            eventReceivers.CreateIfNotExists();
            builder.Services.AddSingleton(eventReceivers);

            var kafkaMsgTable = new TableClient<KafkaMessage>(connectionString);
            kafkaMsgTable.CreateIfNotExists();
            builder.Services.AddSingleton(kafkaMsgTable);
        }

        private static IAsyncPolicy<HttpResponseMessage> GetRetryPolicy() =>
            HttpPolicyExtensions
                .HandleTransientHttpError()
                .OrResult(msg => msg.StatusCode != HttpStatusCode.OK)
                .WaitAndRetryAsync(
                    3,
                    retryAttempt => TimeSpan.FromSeconds(Math.Pow(2, retryAttempt)),
                    onRetry: (outcome, timespan, retryAttempt, context) =>
                    {
                        var logger = context.GetLogger();
                        logger?.LogInformation(
                            $"Request failed with status code " +
                            $"{outcome.Result.StatusCode} delaying " +
                            $"for {timespan.TotalMilliseconds} milliseconds " +
                            $"then making retry {retryAttempt}");
                    });
    }
}
