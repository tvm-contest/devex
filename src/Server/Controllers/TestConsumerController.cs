using System.Threading;
using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;

namespace Server.Controllers
{
    [ApiController]
    [Route("test-consumer/{userId}")]
    public class TestConsumerController : ControllerBase
    {
        private readonly ILogger<TestConsumerController> _logger;
        private readonly IHubContext<SignalRHub> _signalRHub;

        public TestConsumerController(ILogger<TestConsumerController> logger, IHubContext<SignalRHub> signalRHub)
        {
            _logger = logger;
            _signalRHub = signalRHub;
        }

        [HttpPost]
        [Consumes("text/plain")]
        public async Task<IActionResult> Receive(string userId, [FromBody] string message, CancellationToken cancellationToken)
        {
            _logger.LogTrace("Received message: {Consumer} {Message}", userId, message);
            // await _publishEndpoint.Publish<User<SignalRHub>>(new
            // {
            //     UserId = consumer,
            //     Messages = _protocols.ToProtocolDictionary("ReceiveMessage", new object[] { message+'-'+consumer })
            // });

            await _signalRHub.Clients.User(userId).SendAsync("ReceiveMessage", message, cancellationToken);

            return Ok(message);
        }
    }
}