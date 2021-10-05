#nullable enable
using System;
using System.Threading;
using System.Threading.Tasks;
using Common;
using Flurl;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Server.Requests.Endpoint
{
    public class SubmitClientConsumer : IConsumer<SubmitClient>
    {
        private readonly IConfiguration _configuration;
        private readonly ILogger<SubmitClientConsumer> _logger;
        private readonly ServerDbContext _serverDbContext;

        public SubmitClientConsumer(ServerDbContext serverDbContext, ILogger<SubmitClientConsumer> logger, IConfiguration configuration)
        {
            _serverDbContext = serverDbContext;
            _logger = logger;
            _configuration = configuration;
        }

        public async Task Consume(ConsumeContext<SubmitClient> context)
        {
            var cancellationToken = context.CancellationToken;
            var clientId = context.Message.ClientId;
            var data = context.Message.Data.Split('\n');
            var endpoint = data[0];
            var secretKey = data.Length == 2 ? data[1] : null;
            var isTest = endpoint.Equals("test");

            if (!isTest && await ComingSoon(context)) return;
            if (await DontAllowUseServerUrl(context, endpoint)) return;
            GenerateEndpointIfTestCommand(clientId, ref endpoint);
            if (await EndpointValidationError(context, endpoint)) return;
            await AddOrUpdateClientInfoToDb(clientId, endpoint, secretKey, cancellationToken);
            await context.RespondAsync<SubmitClientSuccess>(new { Endpoint = endpoint, IsTest = isTest });
        }

        private async Task AddOrUpdateClientInfoToDb(string clientId, string endpoint, string? secretKey, CancellationToken cancellationToken)
        {
            var clientInfo = await _serverDbContext.ClientInfos.FindAsync(new object[] { clientId }, cancellationToken);
            if (clientInfo == null)
            {
                clientInfo = new ClientInfo { ClientId = clientId, Endpoint = endpoint, SecretKey = secretKey };
                _logger.LogTrace("Adding client info to DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Add(clientInfo);
            }
            else
            {
                clientInfo.Endpoint = endpoint;
                clientInfo.SecretKey = secretKey;
                _logger.LogTrace("Updating client info in DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Update(clientInfo);
            }

            await _serverDbContext.SaveChangesAsync(cancellationToken);
        }

        private static void GenerateEndpointIfTestCommand(string clientId, ref string endpoint)
        {
            if (endpoint.Equals("test", StringComparison.OrdinalIgnoreCase))
                endpoint = Url.Combine(ProjectConstants.ServerUrl, "test-consumer", clientId[..12]);
        }

        private static async Task<bool> EndpointValidationError(ConsumeContext context, string endpoint)
        {
            if (EndpointValidationHelper.IsHttpEndpoint(endpoint)) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.EndpointValidation });
            return true;
        }

        private static async Task<bool> DontAllowUseServerUrl(ConsumeContext context, string endpoint)
        {
            if (!endpoint.StartsWith(ProjectConstants.ServerUrl, StringComparison.OrdinalIgnoreCase)) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.AccessDenied });
            return true;
        }

        private async Task<bool> ComingSoon(ConsumeContext context)
        {
            if (!bool.TryParse(_configuration["COMING_SOON"], out var comingSoon) || !comingSoon) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.ComingSoon });
            return true;
        }
    }
}