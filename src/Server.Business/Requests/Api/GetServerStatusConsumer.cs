using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;

namespace Server.Requests.Api {
    public class GetServerStatusConsumer : IConsumer<GetServerStatus> {
        private readonly ServerDbContext _serverDbContext;

        public GetServerStatusConsumer(ServerDbContext serverDbContext) {
            _serverDbContext = serverDbContext;
        }

        public async Task Consume(ConsumeContext<GetServerStatus> context) {
            var cancellationToken = context.CancellationToken;

            var userCount = await _serverDbContext.ClientInfos.CountAsync(cancellationToken);

            await context.RespondAsync<GetServerStatusResult>(new {
                UserCount = userCount
            });
        }
    }
}