using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Notifon.Server.Database;

namespace Notifon.Server.Business.Requests.Api {
    public class GetServerStatusConsumer : IConsumer<GetServerStatus> {
        private readonly ServerDbContext _serverDbContext;
        private readonly ITonClient _tonClient;

        public GetServerStatusConsumer(ServerDbContext serverDbContext, ITonClient tonClient) {
            _serverDbContext = serverDbContext;
            _tonClient = tonClient;
        }

        public async Task Consume(ConsumeContext<GetServerStatus> context) {
            var cancellationToken = context.CancellationToken;

            var userCount = await _serverDbContext.Users.CountAsync(cancellationToken);
            var endpointCount = await _serverDbContext.Endpoints.CountAsync(cancellationToken);
            var tonEndpoints = await _tonClient.Net.GetEndpoints(cancellationToken);

            await context.RespondAsync<GetServerStatusResult>(new {
                UserCount = userCount,
                EndpointCount = endpointCount,
                TonEndpoints = tonEndpoints.Endpoints
            });
        }
    }
}