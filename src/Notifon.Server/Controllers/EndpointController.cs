using System;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Notifon.Common;
using Notifon.Server.Business;
using Notifon.Server.Business.Requests.Endpoint;
using Notifon.Server.Utils;

namespace Notifon.Server.Controllers {
    [ApiController]
    [Route("endpoint")]
    public class EndpointController : ControllerBase {
        private readonly string _contactUsMessage = $"\n💬 Chat us if you have any questions {ProjectConstants.TelegramLink}";
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
                        new { UserId = hash, Data = data }, cancellationToken);

                if (submitResult.Is(out Response<SubmitClientSuccess> submitClientSuccess))
                    return Ok("👍 Looks good!\n" +
                              $"Notifications will be sent to {submitClientSuccess.Message.Endpoint}" +
                              (submitClientSuccess.Message.IsTest ? "(can be open in web browser)\n" : "\n") +
                              "Now your can set rules for catching blockchain messages 🖐️");

                if (submitResult.Is(out Response<SubmitClientResult> result))
                    return result.Message.ResultType switch {
                        SubmitClientResultType.ComingSoon =>
                            Ok("🌙 Coming soon...\n" +
                               _contactUsMessage),
                        SubmitClientResultType.OkWithMessage =>
                            Ok(result.Message.ResultValue),
                        SubmitClientResultType.EndpointValidationError =>
                            Ok("🔍 Wrong endpoint. Supported formats:\n" +
                               " - HTTP notifications starting with http:// or https://\n" +
                               " - Telegram notifications https://t.me/{channel_id}\n" +
                               " - Emails notification youname@youdomain.com\n" +
                               _contactUsMessage),
                        SubmitClientResultType.AccessDenied =>
                            Ok("🚫 Access denied!\n" +
                               "Pass 'test' as callback url to test this provider\n" +
                               _contactUsMessage),
                        SubmitClientResultType.NoEndpointsRegistered =>
                            Ok("🪹 Your have no registered endpoints\n" +
                               "Use 'help' to get available options\n" +
                               _contactUsMessage),
                        SubmitClientResultType.HelpCommand =>
                            Ok("❓ Available commands:\n" +
                               CommandHelpers.CommandDescription +
                               "\n" +
                               "❗ Supported endpoints and parameters:\n" +
                               "HTTP endpoint:\n" +
                               "http(s)://your-domain.com/you-endpoint [-d]\n" +
                               "test [-d]\n" +
                               "\n" +
                               "Telegram endpoint:\n" +
                               "https://t.me/you_chat [-d] [-t:BOT_TOKEN]\n" +
                               "\n" +
                               "Mailgun endpoint:\n" +
                               "your-name@your-domain.com [-d] [-f:FROM_ADDRESS] [-md:MAILGUN_DOMAIN] [-mk:MAILGUN_APIKEY]\n" +
                               "\n" +
                               "✨ Examples commands:\n" +
                               "'https://notifon.requestcatcher.com/test' just relay encrypted messages to HTTP endpoint\n" +
                               "\n" +
                               "'https://notifon.requestcatcher.com/test -d' decrypt messages with SECRET_KEY and send it to HTTP endpoint\n" +
                               "\n" +
                               "'https://t.me/free_ton_notification' relay encrypted messages to @free_ton_notification uses @free_ton_notify_bot as default bot\n" +
                               "\n" +
                               "'https://t.me/you_chat -t:BOT_TOKEN' send encrypted messages to you_chat uses custom bot(ensure that bot was added to the chat)\n" +
                               "\n" +
                               "'your@email.com -f:notifon@notifon.com; -md:notifon.com; -mk:MAILGUN_APIKEY' decrypt message with SECRET_KEY and send to your@email.com from notifon@notifon.com uses notifon.com domain and MAILGUN_APIKEY\n" +
                               "\n" +
                               "'test -d' send decrypted messages to test endpoint" +
                               _contactUsMessage),
                        _ => throw new ArgumentOutOfRangeException()
                    };
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Something went wrong {UserId}", hash);
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