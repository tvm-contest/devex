using System.Collections.Generic;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.SignalR;
using Microsoft.AspNetCore.SignalR.Protocol;
using Microsoft.Extensions.Logging;

namespace Server.Controllers
{
    [ApiController]
    [Route("test-consumer")]
    public class TestConsumerController : ControllerBase
    {
        private readonly ILogger<TestConsumerController> _logger;
        private readonly IReadOnlyList<IHubProtocol> _protocols = new IHubProtocol[] { new JsonHubProtocol() };
        private readonly IPublishEndpoint _publishEndpoint;
        private readonly IHubContext<SignalRHub> _signalRHub;

        public TestConsumerController(ILogger<TestConsumerController> logger, IPublishEndpoint publishEndpoint, IHubContext<SignalRHub> signalRHub)
        {
            _logger = logger;
            _publishEndpoint = publishEndpoint;
            _signalRHub = signalRHub;
        }

        [HttpPost("{userId}")]
        [Consumes("text/plain")]
        public async Task<IActionResult> Receive(string userId, [FromBody] string message, CancellationToken cancellationToken)
        {
            //take Nonce only for client message
            message = message.Split(' ')[0];

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