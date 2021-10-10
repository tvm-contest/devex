using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Notifon.Server.SignalR;

namespace Notifon.Server.Controllers {
    [ApiController]
    [Route("test-consumer/{userId}")]
    public class TestConsumerController : ControllerBase {
        private readonly IHubContext<SignalRHub> _signalRHub;

        public TestConsumerController(IHubContext<SignalRHub> signalRHub) {
            _signalRHub = signalRHub;
        }

        [HttpPost]
        [Consumes("text/plain")]
        public async Task<IActionResult> Receive(string userId, [FromBody] string message,
            CancellationToken cancellationToken) {
            await _signalRHub.Clients.User(userId).SendAsync("ReceiveMessage", message, cancellationToken);

            return Ok(message);
        }
    }
}