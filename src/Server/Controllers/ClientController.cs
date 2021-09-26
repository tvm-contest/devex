using System.Threading;
using System.Threading.Tasks;
using MassTransit.Mediator;
using Microsoft.AspNetCore.Mvc;
using Server.Business.Requests;
using Shared.Requests;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/client")]
    public class ClientController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ClientController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet("get-server-status")]
        public async Task<GetServerStatusResult> GetServerStatus(CancellationToken cancellationToken)
        {
            var response = await _mediator
                .CreateRequestClient<GetServerStatus>()
                .GetResponse<GetServerStatusResult>(new { }, cancellationToken);

            return response.Message;
        }
    }
}