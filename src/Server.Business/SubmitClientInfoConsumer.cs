using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Server.Database;

namespace Server.Business
{
    public class SubmitClientInfoConsumer : IConsumer<SubmitClientInfo>
    {
        private readonly IDbContextFactory<ServerDbContext> _serverContext;

        public SubmitClientInfoConsumer(IDbContextFactory<ServerDbContext> serverContext)
        {
            _serverContext = serverContext;
        }

        public async Task Consume(ConsumeContext<SubmitClientInfo> context)
        {
            var cancellationToken = context.CancellationToken;
            var clientInfo = new ClientInfo { Hash = context.Message.Hash, Endpoint = context.Message.Endpoint };

            await using var dbContext = _serverContext.CreateDbContext();
            if (await dbContext.ClientInfos.AnyAsync(info => info.Hash == clientInfo.Hash, cancellationToken))
                dbContext.ClientInfos.Update(clientInfo);
            else
                dbContext.ClientInfos.Add(clientInfo);

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}