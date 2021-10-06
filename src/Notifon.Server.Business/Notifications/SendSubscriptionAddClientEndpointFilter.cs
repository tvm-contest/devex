using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Microsoft.Extensions.Logging;
using Notifon.Server.Database;

namespace Notifon.Server.Business.Notifications {
    public class SendSubscriptionAddClientInfoHeaderFilter<T> : IFilter<PublishContext<T>> where T : class {
        private readonly ILogger<SendSubscriptionAddClientInfoHeaderFilter<T>> _logger;
        private readonly ServerDbContext _serverContext;

        public SendSubscriptionAddClientInfoHeaderFilter(ServerDbContext serverContext,
            ILogger<SendSubscriptionAddClientInfoHeaderFilter<T>> logger) {
            _serverContext = serverContext;
            _logger = logger;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next) {
            if (context.Message is SendSubscription message) {
                var cancellationToken = context.CancellationToken;

                var clientInfo =
                    await _serverContext.ClientInfos.FindAsync(new object[] { message.ClientId }, cancellationToken);
                if (clientInfo == null) {
                    _logger.LogWarning("Client {ClientId} not found in the Database, skip publishing..",
                        message.ClientId);
                    return;
                }

                context.Headers.Set(typeof(ClientInfo).FullName, clientInfo);
                await next.Send(context);
            }
            else {
                await next.Send(context);
            }
        }

        public void Probe(ProbeContext context) { }
    }
}