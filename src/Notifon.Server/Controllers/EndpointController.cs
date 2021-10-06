using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Notifon.Common;
using Notifon.Server.Business.Requests.Endpoint;
using Notifon.Server.Utils;

namespace Notifon.Server.Controllers {
    [ApiController]
    [Route("endpoint")]
    public class EndpointController : ControllerBase {
        private readonly ILogger<EndpointController> _logger;
        private readonly IRequestClient<SubmitClient> _submitClientRequestClient;

        public EndpointController(ILogger<EndpointController> logger,
            IRequestClient<SubmitClient> submitClientRequestClient) {
            _logger = logger;
            _submitClientRequestClient = submitClientRequestClient;
        }

        [HttpPost]
        [EnableCors(PolicyName = "SubmitClient")]
        public async Task<OkObjectResult> SubmitClient([FromForm] EndpointParameters parameters,
            CancellationToken cancellationToken) {
            var hash = parameters.Hash;
            var data = parameters.Data?.StringFromBase64() ?? string.Empty;

            _logger.LogTrace("Received hash: {Hash} endpoint: {Endpoint}", hash, data);

            try {
                var submitResult = await _submitClientRequestClient
                    .GetResponse<SubmitClientSuccess, SubmitClientResult>(
                        new { ClientId = hash, Data = data }, cancellationToken);

                if (submitResult.Is(out Response<SubmitClientSuccess> submitClientSuccess))
                    return Ok("👍 Looks good!\n" +
                              $"Notifications will be sent to {submitClientSuccess.Message.Endpoint}" +
                              (submitClientSuccess.Message.IsTest ? "(can be open in web browser)\n" : "\n") +
                              "Now your can set rules for catching blockchain messages 🖐️");

                if (submitResult.Is(out Response<SubmitClientResult> result))
                    return result.Message.ResultType switch {
                        SubmitClientResultType.ComingSoon =>
                            Ok("🌙 Coming soon...\n" +
                               $"💬 Contact us to get help {ProjectConstants.TelegramLink}\n"),
                        SubmitClientResultType.EndpointValidationError =>
                            Ok("🔍 Wrong endpoint. Supported formats:\n" +
                               " - HTTP notifications starting with http:// or https://\n" +
                               " - Telegram notifications https://t.me/{channel_id}\n" +
                               " - Emails notification youname@youdomain.com\n" +
                               $"💬 Contact us to get help {ProjectConstants.TelegramLink}\n"),
                        SubmitClientResultType.AccessDenied =>
                            Ok("🚫 Access denied! Pass \"test\" keyword as callback url to test this provider"),
                        SubmitClientResultType.ListCommand =>
                            Ok($"📋 Your endpoints:\n{result.Message.Message}"),
                        _ => throw new ArgumentOutOfRangeException()
                    };
            }
            catch {
                // ignored
            }

            return Ok("🚨 Oops Something went wrong 😱\n" +
                      $"Client hash: {hash}\n" +
                      "Contact us to get help https://t.me/ton_actions_chat\n" +
                      "Also you can pass \"test\" keyword as callback url to test this provider");
        }

        public class EndpointParameters {
            [Required(AllowEmptyStrings = false)] public string Hash { get; init; }

            public string Data { get; init; }
        }
    }
}