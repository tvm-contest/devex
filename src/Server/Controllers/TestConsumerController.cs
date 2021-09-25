using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Logging;
using Server.SignalR;

namespace Server.Controllers
{
    [ApiController]
    [Route("test-consumer")]
    public class TestConsumerController : ControllerBase
    {
        private readonly ILogger<TestConsumerController> _logger;
        private readonly IHubContext<TestConsumerHub> _testConsumerHub;

        public TestConsumerController(ILogger<TestConsumerController> logger, IHubContext<TestConsumerHub> testConsumerHub)
        {
            _logger = logger;
            _testConsumerHub = testConsumerHub;
        }

        [HttpPost]
        [Consumes("text/plain")]
        public async Task<IActionResult> Receive([FromBody] string message)
        {
            _logger.LogTrace("Received message: {Message}", message);

            await _testConsumerHub.Clients.All.SendAsync("ReceiveMessage", message);

            _logger.LogTrace("Message '{Message}' was sent to clients", message);

            return Ok(message);
        }
    }
}