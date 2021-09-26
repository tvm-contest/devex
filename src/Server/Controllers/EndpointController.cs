using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using MassTransit.Mediator;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Server.Business.Requests;
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
        [EnableCors(PolicyName = "SubmitEndpoint")]
        public async Task<OkObjectResult> Submit([FromForm] EndpointParameters parameters, CancellationToken cancellationToken)
        {
            var hash = parameters.Hash;
            var endpoint = parameters.Data.FromBase64();

            _logger.LogTrace("Received hash: {Hash} endpoint: {Endpoint}", hash, endpoint);

            try
            {
                var submitResult = await _mediator
                    .CreateRequestClient<SubmitClientInfo>()
                    .GetResponse<SubmitClientSuccess, SubmitClientValidateEndpointError>(
                        new { hash, endpoint }, cancellationToken);

                if (submitResult.Is(out Response<SubmitClientSuccess> _))
                    return Ok("👍 Looks good!\n" +
                              $"Notifications will be sent to {endpoint}\n" +
                              "Now your can set rules for catching blockchain messages 🖐️");

                if (submitResult.Is(out Response<SubmitClientValidateEndpointError> _))
                    return Ok($"🔍 Wrong endpoint format in {endpoint}\n" +
                              "Supported HTTP notifications starting with http:// or https://\n" +
                              "Contact us to get help https://t.me/ton_actions_chat\n");
            }
            catch
            {
                // ignored
            }

            return Ok("🚨 Oops Something went wrong 😱\n" +
                      $"Client hash: {hash}" +
                      "Contact us to get help https://t.me/ton_actions_chat\n");
        }

        public class EndpointParameters
        {
            [Required(AllowEmptyStrings = false)] public string Hash { get; init; }

            [Required(AllowEmptyStrings = false)] public string Data { get; init; }
        }
    }
}