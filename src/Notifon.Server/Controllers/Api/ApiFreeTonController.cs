using System;
using System.Threading;
using System.Threading.Tasks;
using ch1seL.TonNet.Client;
using MassTransit;
using Microsoft.AspNetCore.Mvc;
using Notifon.Server.Business.Requests.TonClient;
using NSwag.Annotations;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [OpenApiTag("API")]
    [Route("api/free-ton")]
    public class ApiFreeTonController : ControllerBase {
        private readonly IRequestClient<FreeTonDeploy> _freeTonDeployClient;
        private readonly IRequestClient<FreeTonSendMessage> _freeTonSendMessageClient;

        public ApiFreeTonController(IRequestClient<FreeTonSendMessage> freeTonSendMessageClient,
            IRequestClient<FreeTonDeploy> freeTonDeployClient) {
            _freeTonSendMessageClient = freeTonSendMessageClient;
            _freeTonDeployClient = freeTonDeployClient;
        }

        [HttpPost("send-message")]
        public async Task<FreeTonSendMessageResult> SendMessage(FreeTonSendMessage request, CancellationToken cancellationToken) {
            try {
                var response = await _freeTonSendMessageClient
                    .GetResponse<FreeTonSendMessageResult>(request, cancellationToken);
                return response.Message;
            }
            catch (Exception e) when (e.InnerException is TonClientException) {
                return new FreeTonSendMessageResult {
                    Success = false,
                    Error = e.InnerException.Message
                };
            }
        }

        [HttpPost("deploy")]
        public async Task<FreeTonDeployResult> Deploy(FreeTonDeploy request, CancellationToken cancellationToken) {
            try {
                var response = await _freeTonDeployClient
                    .GetResponse<FreeTonDeployResult>(request, cancellationToken);
                return response.Message;
            }
            catch (Exception e) when (e.InnerException is TonClientException) {
                return new FreeTonDeployResult {
                    Success = false,
                    Error = e.InnerException.Message
                };
            }
        }
    }
}