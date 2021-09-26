using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Server.Database;
using Shared.Requests;

namespace Server.Business.Requests
{
    public class GetServerStatusConsumer : IConsumer<GetServerStatus>
    {
        private readonly ServerDbContext _serverDbContext;

        public GetServerStatusConsumer(ServerDbContext serverDbContext)
        {
            _serverDbContext = serverDbContext;
        }

        public async Task Consume(ConsumeContext<GetServerStatus> context)
        {
            var cancellationToken = context.CancellationToken;

            var userCount = await _serverDbContext.ClientInfos.CountAsync(cancellationToken: cancellationToken);

            await context.RespondAsync<GetServerStatusResult>(new
            {
                UserCount = userCount
            });
        }
    }
}