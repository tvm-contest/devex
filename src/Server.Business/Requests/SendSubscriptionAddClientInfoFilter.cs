using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Microsoft.Extensions.Logging;

namespace Server.Requests
{
    public class SendSubscriptionAddClientInfoFilter<T> : IFilter<PublishContext<T>> where T : class
    {
        private readonly ILogger<SendSubscriptionAddClientInfoFilter<T>> _logger;
        private readonly ServerDbContext _serverContext;

        public SendSubscriptionAddClientInfoFilter(ServerDbContext serverContext, ILogger<SendSubscriptionAddClientInfoFilter<T>> logger)
        {
            _serverContext = serverContext;
            _logger = logger;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next)
        {
            if (context.Message is SendSubscription message)
            {
                var cancellationToken = context.CancellationToken;

                var clientInfo = await _serverContext.ClientInfos.FindAsync(new object[] { message.Hash }, cancellationToken);
                if (clientInfo == null)
                {
                    _logger.LogWarning("Client {ClientHash} not found in the Database, skip publishing..", message.Hash);
                    return;
                }

                context.Headers.Set("clientInfo", clientInfo);
                await next.Send(context);
            }
            else
            {
                await next.Send(context);
            }
        }

        public void Probe(ProbeContext context)
        {
        }
    }
}