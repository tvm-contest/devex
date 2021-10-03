using System;
using System.Threading;
using System.Threading.Tasks;
using Common;
using Flurl;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;

namespace Server.Requests
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
            var hash = context.Message.Hash;
            var endpoint = context.Message.Endpoint;
            const string serviceUrl = ProjectConstants.ServerUrl;
            var testConsumerUrl = Url.Combine(serviceUrl, "test-consumer");

            if (await ComingSoon(context)) return;
            if (await DontAllowUseServerUrl(context, endpoint, serviceUrl)) return;
            endpoint = GenerateEndpointIfTestCommand(endpoint, testConsumerUrl, hash);
            if (await EndpointValidationError(context, endpoint)) return;
            await AddOrUpdateClientInfoToDb(hash, endpoint, cancellationToken);
            await context.RespondAsync<SubmitClientSuccess>(new { Endpoint = endpoint, IsTest = true });
        }

        private async Task AddOrUpdateClientInfoToDb(string hash, string endpoint, CancellationToken cancellationToken)
        {
            var clientInfo = await _serverDbContext.ClientInfos.FindAsync(new object[] { hash }, cancellationToken);
            if (clientInfo == null)
            {
                clientInfo = new ClientInfo { Hash = hash, Endpoint = endpoint };
                _logger.LogTrace("Adding client info to DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Add(clientInfo);
            }
            else
            {
                clientInfo.Endpoint = endpoint;
                _logger.LogTrace("Updating client info to DB {@ClientInfo}", clientInfo);
                _serverDbContext.ClientInfos.Update(clientInfo);
            }

            await _serverDbContext.SaveChangesAsync(cancellationToken);
        }

        private static string GenerateEndpointIfTestCommand(string endpoint, string testConsumerUrl, string hash)
        {
            return endpoint.Equals("test", StringComparison.OrdinalIgnoreCase)
                ? Url.Combine(testConsumerUrl, hash[..12])
                : endpoint;
        }

        private static async Task<bool> EndpointValidationError(ConsumeContext context, string endpoint)
        {
            if (EndpointValidationHelper.IsHttpEndpoint(endpoint)) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.EndpointValidation });
            return true;
        }

        private static async Task<bool> DontAllowUseServerUrl(ConsumeContext context, string endpoint, string serviceUrl)
        {
            if (!endpoint.StartsWith(serviceUrl, StringComparison.OrdinalIgnoreCase)) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.AccessDenied });
            return true;
        }

        private async Task<bool> ComingSoon(ConsumeContext<SubmitClient> context)
        {
            if (context.Message.Endpoint.Equals("test")) return false;
            if (!bool.TryParse(_configuration["COMING_SOON"], out var comingSoon) || !comingSoon) return false;
            await context.RespondAsync<SubmitClientError>(new { ErrorType = SubmitClientErrorType.ComingSoon });
            return true;
        }
    }
}