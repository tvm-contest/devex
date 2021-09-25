using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit.Mediator;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Server.Business;
using Utils;

namespace Server.Controllers
{
    [ApiController]
    [Route("endpoint")]
    public class EndpointController : ControllerBase
    {
        private readonly ILogger<EndpointController> _logger;
        private readonly IMediator _mediator;

        public EndpointController(ILogger<EndpointController> logger, IMediator mediator)
        {
            _logger = logger;
            _mediator = mediator;
        }

        [HttpPost]
        public async Task<EndpointParameters> Receive([FromForm] EndpointParameters parameters, CancellationToken cancellationToken)
        {
            _logger.LogTrace("Received hash: {Hash} data: {Data}", parameters.Hash, parameters.Data);

            await _mediator.Send<SubmitClientInfo>(new
            {
                parameters.Hash,
                Endpoint = parameters.Data.FromBase64()
            }, cancellationToken);

            return parameters;
        }

        public class EndpointParameters
        {
            [Required(AllowEmptyStrings = false)] public string Hash { get; init; }

            [Required(AllowEmptyStrings = false)] public string Data { get; init; }
        }
    }
}