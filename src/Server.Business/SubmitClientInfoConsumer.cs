using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Server.Database;

namespace Server.Business
{
    public class SubmitClientInfoConsumer : IConsumer<SubmitClientInfo>
    {
        private readonly ILogger<SubmitClientInfoConsumer> _logger;
        private readonly IDbContextFactory<ServerDbContext> _serverContext;

        public SubmitClientInfoConsumer(IDbContextFactory<ServerDbContext> serverContext, ILogger<SubmitClientInfoConsumer> logger)
        {
            _serverContext = serverContext;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SubmitClientInfo> context)
        {
            var cancellationToken = context.CancellationToken;
            var clientInfo = new ClientInfo { Hash = context.Message.Hash, Endpoint = context.Message.Endpoint };

            _logger.LogTrace("Saving client info to DB {@ClientInfo}", clientInfo);

            await using var dbContext = _serverContext.CreateDbContext();

            if (await dbContext.ClientInfos.AnyAsync(info => info.Hash == clientInfo.Hash, cancellationToken))
                dbContext.ClientInfos.Update(clientInfo);
            else
                dbContext.ClientInfos.Add(clientInfo);

            await dbContext.SaveChangesAsync(cancellationToken);
        }
    }
}