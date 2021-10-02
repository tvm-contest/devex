using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Server.Requests;

namespace Server.Controllers
{
    [ApiController]
    [Route("endpoint")]
    public class EndpointController : ControllerBase
    {
        private readonly ILogger<EndpointController> _logger;
        private readonly IRequestClient<SubmitClient> _submitClientRequestClient;

        public EndpointController(ILogger<EndpointController> logger, IRequestClient<SubmitClient> submitClientRequestClient)
        {
            _logger = logger;
            _submitClientRequestClient = submitClientRequestClient;
        }

        [HttpPost]
        [EnableCors(PolicyName = "SubmitClient")]
        public async Task<OkObjectResult> SubmitClient([FromForm] EndpointParameters parameters, CancellationToken cancellationToken)
        {
            var hash = parameters.Hash;
            var endpoint = parameters.Data.FromBase64();

            _logger.LogTrace("Received hash: {Hash} endpoint: {Endpoint}", hash, endpoint);

            try
            {
                var submitResult = await _submitClientRequestClient
                    .GetResponse<SubmitClientSuccess, SubmitClientError>(
                        new { hash, endpoint }, cancellationToken);

                if (submitResult.Is(out Response<SubmitClientSuccess> submitClientSuccess))
                    return Ok("👍 Looks good!\n" +
                              $"Notifications will be sent to {submitClientSuccess.Message.Endpoint}" +
                              (submitClientSuccess.Message.IsTest ? "(can be open in web browser)\n" : "\n") +
                              "Now your can set rules for catching blockchain messages 🖐️");

                if (submitResult.Is(out Response<SubmitClientError> error))
                {
                    return error.Message.ErrorType switch
                    {
                        SubmitClientErrorType.ComingSoon =>
                            Ok("🌙 Coming soon...\n"
                               + "Contact us to get help https://t.me/ton_actions_chat\n"),
                        SubmitClientErrorType.EndpointValidation =>
                            Ok($"🔍 Wrong endpoint format in {endpoint}\n" +
                               "Supported HTTP notifications starting with http:// or https://\n" +
                               "Contact us to get help https://t.me/ton_actions_chat\n"),
                        SubmitClientErrorType.AccessDenied =>
                            Ok("Pass \"test\" keyword as callback url to test this provider"),
                        _ => throw new ArgumentOutOfRangeException()
                    };
                }
            }
            catch
            {
                // ignored
            }

            return Ok("🚨 Oops Something went wrong 😱\n" +
                      $"Client hash: {hash}\n" +
                      "Contact us to get help https://t.me/ton_actions_chat\n" +
                      "Also you can pass \"test\" keyword as callback url to test this provider");
        }

        public class EndpointParameters
        {
            [Required(AllowEmptyStrings = false)] public string Hash { get; init; }

            [Required(AllowEmptyStrings = false)] public string Data { get; init; }
        }
    }
}