using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Server.Database;

namespace Server.Business
{
    public class SendSubscriptionConsumer : IConsumer<SendSubscription>
    {
        private readonly HttpClient _httpClient;
        private readonly ILogger<SendSubscriptionConsumer> _logger;
        private readonly IDbContextFactory<ServerDbContext> _serverContext;

        public SendSubscriptionConsumer(IDbContextFactory<ServerDbContext> serverContext, HttpClient httpClient, ILogger<SendSubscriptionConsumer> logger)
        {
            _serverContext = serverContext;
            _httpClient = httpClient;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var cancellationToken = context.CancellationToken;
            await using var dbContext = _serverContext.CreateDbContext();

            var clientInfo = await dbContext.ClientInfos.FindAsync(new object[] { context.Message.Hash }, cancellationToken);
            if (clientInfo == null)
            {
                _logger.LogDebug("Client {Hash} not found in DB, so skipping delivery", context.Message.Hash);
                return;
            }

            var message = $"{context.Message.Nonce} {context.Message.EncodedMessage}";

            _logger.LogTrace("Sending message to client {Endpoint} {Message}", clientInfo.Endpoint, message);

            var consumerResponse = await _httpClient.PostAsync(clientInfo.Endpoint, new StringContent(message), cancellationToken);
            consumerResponse.EnsureSuccessStatusCode();
        }
    }
}