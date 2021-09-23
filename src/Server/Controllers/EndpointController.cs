using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Server.Models;

namespace Server.Controllers
{
    [ApiController]
    [Route("[controller]")]
    public class EndpointController : ControllerBase
    {
        private readonly ILogger<EndpointController> _logger;

        public EndpointController(ILogger<EndpointController> logger)
        {
            _logger = logger;
        }

        [HttpPost]
        public EndpointParameters Receive([FromForm]EndpointParameters endpointParameters)
        {
            _logger.LogInformation("Received hash: {Hash} data: {Data}", endpointParameters.Hash, endpointParameters.Data);
            
            return endpointParameters;
        }
    }
}