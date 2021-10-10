using System.Threading;
using System.Threading.Tasks;
using MassTransit.Mediator;
using Microsoft.AspNetCore.Mvc;
using Notifon.Server.Business.Requests.TonClient;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [Route("api/free-ton")]
    public class ApiFreeTonController : ControllerBase {
        private readonly IMediator _mediator;

        public ApiFreeTonController(IMediator mediator) {
            _mediator = mediator;
        }

        [HttpPost("deploy")]
        public async Task<FreeTonDeployResult> Deploy(FreeTonDeploy request, CancellationToken cancellationToken) {
            var response = await _mediator
                .CreateRequest(request, cancellationToken)
                .GetResponse<FreeTonDeployResult>();

            return response.Message;
        }

        [HttpPost("send-message")]
        public async Task<FreeTonSendMessageResult> SendMessage(FreeTonSendMessage request, CancellationToken cancellationToken) {
            var response = await _mediator
                .CreateRequest(request, cancellationToken)
                .GetResponse<FreeTonSendMessageResult>();
            return response.Message;
        }
    }
}