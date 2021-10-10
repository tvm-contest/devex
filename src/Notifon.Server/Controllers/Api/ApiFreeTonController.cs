using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Notifon.Server.Business.Requests.TonClient;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [Route("api/free-ton")]
    public class ApiFreeTonController : ControllerBase {
        private readonly IRequestClient<FreeTonSendMessage> _freeTonSendMessageClient;

        public ApiFreeTonController(IRequestClient<FreeTonSendMessage> freeTonSendMessageClient) {
            _freeTonSendMessageClient = freeTonSendMessageClient;
        }

        [HttpPost("send-message")]
        public async Task<FreeTonSendMessageResult> SendMessage(FreeTonSendMessage request, CancellationToken cancellationToken) {
            var response = await _freeTonSendMessageClient
                .GetResponse<FreeTonSendMessageResult>(request, cancellationToken);

            return response.Message;
        }
    }
}