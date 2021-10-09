using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Notifon.Server.Database;

namespace Notifon.Server.Business.Requests.Api {
    public class GetServerStatusConsumer : IConsumer<GetServerStatus> {
        private readonly ServerDbContext _serverDbContext;

        public GetServerStatusConsumer(ServerDbContext serverDbContext) {
            _serverDbContext = serverDbContext;
        }

        public async Task Consume(ConsumeContext<GetServerStatus> context) {
            var cancellationToken = context.CancellationToken;

            var userCount = await _serverDbContext.Users.CountAsync(cancellationToken);
            var endpointCount = await _serverDbContext.Endpoints.CountAsync(cancellationToken);

            await context.RespondAsync<GetServerStatusResult>(new {
                UserCount = userCount,
                EndpointCount = endpointCount
            });
        }
    }
}