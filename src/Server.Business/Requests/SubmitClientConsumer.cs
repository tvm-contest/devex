using System;
using System.Threading.Tasks;
using Flurl;
using MassTransit;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using Server.Database;
using Shared;

namespace Server.Business.Requests
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

            //don't allow custom test url
            if (endpoint.StartsWith(serviceUrl, StringComparison.OrdinalIgnoreCase))
            {
                await context.RespondAsync<SubmitClientAccessDeniedError>(new { });
                return;
            }

            //generate test url by user hash
            if (endpoint.Equals("test", StringComparison.OrdinalIgnoreCase))
            {
                endpoint = Url.Combine(testConsumerUrl, hash[..12]);
            }

            if (!EndpointValidationHelper.Validate(endpoint))
            {
                await context.RespondAsync<SubmitClientValidateEndpointError>(new { });
                return;
            }

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

            await context.RespondAsync<SubmitClientSuccess>(new { Endpoint = endpoint, IsTest = true });
        }
    }
}