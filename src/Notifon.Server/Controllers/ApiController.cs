using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Notifon.Server.Business.Requests.Api;

namespace Notifon.Server.Controllers {
    [ApiController]
    [Route("api/status")]
    public class ApiController : ControllerBase {
        private readonly IRequestClient<GetServerStatus> _getServerStatusRequestClient;

        public ApiController(IRequestClient<GetServerStatus> getServerStatusRequestClient) {
            _getServerStatusRequestClient = getServerStatusRequestClient;
        }

        [HttpGet]
        public async Task<GetServerStatusResult> GetServerStatus(CancellationToken cancellationToken) {
            var response = await _getServerStatusRequestClient
                .GetResponse<GetServerStatusResult>(new { }, cancellationToken);

            return response.Message;
        }
    }
}