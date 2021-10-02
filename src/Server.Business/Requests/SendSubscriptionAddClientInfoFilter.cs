using System;
using System.Threading.Tasks;
using GreenPipes;
using MassTransit;

namespace Server.Requests
{
    public class SendSubscriptionAddClientInfoFilter<T> : IFilter<PublishContext<T>> where T : class
    {
        private readonly ServerDbContext _serverContext;

        public SendSubscriptionAddClientInfoFilter(ServerDbContext serverContext)
        {
            _serverContext = serverContext;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next)
        {
            if (context.Message is SendSubscription message)
            {
                var cancellationToken = context.CancellationToken;

                var clientInfo = await _serverContext.ClientInfos.FindAsync(new object[] { message.Hash }, cancellationToken);
                if (clientInfo == null) throw new NullReferenceException("Client not found") { Data = { { "ClientHash", message.Hash } } };
                context.Headers.Set("clientInfo", clientInfo);
            }

            await next.Send(context);
        }

        public void Probe(ProbeContext context)
        {
        }
    }
}