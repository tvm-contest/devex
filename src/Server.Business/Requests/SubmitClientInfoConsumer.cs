using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Logging;
using Server.Database;

namespace Server.Business.Requests
{
    public class SubmitClientInfoConsumer : IConsumer<SubmitClientInfo>
    {
        private readonly ILogger<SubmitClientInfoConsumer> _logger;
        private readonly ServerDbContext _serverDbContext;

        public SubmitClientInfoConsumer(ServerDbContext serverDbContext, ILogger<SubmitClientInfoConsumer> logger)
        {
            _serverDbContext = serverDbContext;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SubmitClientInfo> context)
        {
            var cancellationToken = context.CancellationToken;

            if (!EndpointValidationHelper.Validate(context.Message.Endpoint))
            {
                await context.RespondAsync<SubmitClientValidateEndpointError>(new { });
                return;
            }

            var clientInfo = await _serverDbContext.ClientInfos.FindAsync(new object[] { context.Message.Hash }, cancellationToken);
            if (clientInfo == null)
            {
                clientInfo = new ClientInfo { Hash = context.Message.Hash, Endpoint = context.Message.Endpoint };
                _logger.LogTrace("Adding client info to DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Add(clientInfo);
            }
            else
            {
                clientInfo.Endpoint = context.Message.Endpoint;
                _logger.LogTrace("Updating client info to DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Update(clientInfo);
            }

            await _serverDbContext.SaveChangesAsync(cancellationToken);

            await context.RespondAsync<SubmitClientSuccess>(new { });
        }
    }
}