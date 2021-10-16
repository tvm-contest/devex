using System;
using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.Threading;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.AspNetCore.Cors;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Logging;
using Notifon.Server.Business.Requests.Endpoint;
using Notifon.Server.Database.Models;
using Notifon.Server.Utils;

namespace Notifon.Server.Controllers {
    [ApiController]
    [Route("")]
    [Route("endpoint")]
    public class EndpointController : ControllerBase {
        private readonly ILogger<EndpointController> _logger;
        private readonly MenuHelper _menuHelper;
        private readonly IRequestClient<SubmitClient> _submitClientRequestClient;

        public EndpointController(ILogger<EndpointController> logger,
            IRequestClient<SubmitClient> submitClientRequestClient, MenuHelper menuHelper) {
            _logger = logger;
            _submitClientRequestClient = submitClientRequestClient;
            _menuHelper = menuHelper;
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
                    .GetResponse<SubmitClientSuccess, SubmitClientResult>(new { UserId = hash, Data = data }, cancellationToken);

                if (submitResult.Is(out Response<SubmitClientSuccess> submitClientSuccess))
                    return Ok(MenuHelper.FormatSubmitClientSuccessMessage(submitClientSuccess.Message));

                if (submitResult.Is(out Response<SubmitClientResult> result))
                    return result.Message.ResultType switch {
                        SubmitClientResultType.OkWithMessage => Ok(result.Message.ResultValue),
                        SubmitClientResultType.ComingSoon => Ok(_menuHelper.ComingSoon),
                        SubmitClientResultType.NotSupportedEndpointFormat => Ok(_menuHelper.NotSupportedEndpointFormat),
                        SubmitClientResultType.AccessDenied => Ok(_menuHelper.AccessDenied),
                        SubmitClientResultType.NoEndpointsRegistered => Ok(_menuHelper.NoEndpointsRegistered),
                        SubmitClientResultType.HelpCommand => Ok(_menuHelper.HelpCommand),
                        SubmitClientResultType.ListEndpoints => Ok(
                            MenuHelper.ListEndpoints((List<EndpointModel>)result.Message.ResultValue)),
                        _ => throw new ArgumentOutOfRangeException()
                    };
            }
            catch (Exception ex) {
                _logger.LogError(ex, "Something went wrong {UserId}", hash);
            }

            return Ok(string.Format(MenuHelper.SomethingWentWrong, hash));
        }

        public class EndpointParameters {
            [Required(AllowEmptyStrings = false)] public string Hash { get; init; }

            public string Data { get; init; }
        }
    }
}