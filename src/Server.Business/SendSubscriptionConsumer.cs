using System.Net.Http;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Server.Database;

namespace Server.Business
{
    public class SendSubscriptionConsumer : IConsumer<SendSubscription>
    {
        private readonly HttpClient _httpClient;
        private readonly IDbContextFactory<ServerDbContext> _serverContext;

        public SendSubscriptionConsumer(IDbContextFactory<ServerDbContext> serverContext, HttpClient httpClient)
        {
            _serverContext = serverContext;
            _httpClient = httpClient;
        }

        public async Task Consume(ConsumeContext<SendSubscription> context)
        {
            var cancellationToken = context.CancellationToken;
            await using var dbContext = _serverContext.CreateDbContext();
            var clientInfo = await dbContext.ClientInfos.FindAsync(context.Message.Hash, cancellationToken);
            if (clientInfo == null) return;
            var content = new StringContent($"{context.Message.Nonce} {context.Message.EncodedMessage}");
            var consumerResponse = await _httpClient.PostAsync(clientInfo.Endpoint, content, cancellationToken);
            consumerResponse.EnsureSuccessStatusCode();
        }
    }
}