using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Notifon.Server.Business.Requests.Api;
using NSwag.Annotations;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [OpenApiTag("API")]
    [Route("api/status")]
    public class ApiStatusController : ControllerBase {
        private readonly IRequestClient<GetServerStatus> _getServerStatusRequestClient;

        public ApiStatusController(IRequestClient<GetServerStatus> getServerStatusRequestClient) {
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