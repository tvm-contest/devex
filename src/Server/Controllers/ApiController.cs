using System.Threading;
using System.Threading.Tasks;
using MassTransit.Mediator;
using Microsoft.AspNetCore.Mvc;
using Server.Business.Requests;

namespace Server.Controllers
{
    [ApiController]
    [Route("api/status")]
    public class ApiController : ControllerBase
    {
        private readonly IMediator _mediator;

        public ApiController(IMediator mediator)
        {
            _mediator = mediator;
        }

        [HttpGet]
        public async Task<GetServerStatusResult> GetServerStatus(CancellationToken cancellationToken)
        {
            var response = await _mediator
                .CreateRequestClient<GetServerStatus>()
                .GetResponse<GetServerStatusResult>(new { }, cancellationToken);

            return response.Message;
        }
    }
}