#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading;
using System.Threading.Tasks;
using Flurl;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Database;
using Notifon.Server.Database.Models;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Requests.Endpoint {
    public class SubmitClientConsumer : IConsumer<SubmitClient> {
        private readonly IOptions<AppOptions> _appOptionsAccessor;
        private readonly IConfiguration _configuration;
        private readonly ServerDbContext _db;

        public SubmitClientConsumer(ServerDbContext db, IConfiguration configuration, IOptions<AppOptions> appOptionsAccessor) {
            _db = db;
            _configuration = configuration;
            _appOptionsAccessor = appOptionsAccessor;
        }

        public async Task Consume(ConsumeContext<SubmitClient> context) {
            var userId = context.Message.UserId;
            var command = Command.FromData(context.Message.Data);

            if (await ComingSoon(context)) return;

            Type? messageType;
            object? message;
            switch (command.CommandType) {
                case CommandType.AddEndpoint:
                    if (!TryGetEndpoint(command.Parameters, out var endpointId, out var endpointType, out message)) {
                        messageType = typeof(SubmitClientResult);
                        break;
                    }

                    messageType = typeof(SubmitClientSuccess);
                    var isSecretRequired = await AddOrUpdateEndpoint(userId, endpointId, endpointType, command.Parameters,
                        context.CancellationToken);
                    message = new { Endpoint = endpointId, IsTest = false, IsSecretRequired = isSecretRequired };
                    break;
                case CommandType.RemoveEndpoint:
                    messageType = typeof(SubmitClientResult);
                    message = await RemoveEndpoint(userId, command.Parameters, context.CancellationToken);
                    break;
                case CommandType.ClearEndpoints:
                    messageType = typeof(SubmitClientResult);
                    message = await ClearEndpoints(userId, context.CancellationToken);
                    break;
                case CommandType.Help:
                    messageType = typeof(SubmitClientResult);
                    message = new { ResultType = SubmitClientResultType.HelpCommand };
                    break;
                case CommandType.ListEndpoints:
                    messageType = typeof(SubmitClientResult);
                    message = await ListCommand(userId, context.CancellationToken);
                    break;
                case CommandType.Secret:
                    messageType = typeof(SubmitClientResult);
                    message = await SecretCommand(userId, command.Parameters, context.CancellationToken);
                    break;
                case CommandType.Test:
                    messageType = typeof(SubmitClientSuccess);
                    message = await TestCommand(userId, command.Parameters, context.CancellationToken);
                    break;
                default:
                    throw new ArgumentOutOfRangeException();
            }

            if (message == null || messageType == null) throw new NullReferenceException();


            // todo: find out why explicit call doesn't work 
            // await context.RespondAsync(message, messageType);
            typeof(ConsumeContext)
                .GetMethod(nameof(ConsumeContext.RespondAsync), 1, new[] { typeof(object) })
                !.MakeGenericMethod(messageType)
                .Invoke(context, new[] { message });
        }

        private bool TryGetEndpoint(IReadOnlyDictionary<string, string?> parameters, out string endpointId,
            out EndpointType endpointType, out object? message) {
            endpointType = EndpointType.Http;
            message = null;

            if (!parameters.TryGetValue("mainParam", out endpointId!) || string.IsNullOrWhiteSpace(endpointId)) {
                message = new { ResultType = SubmitClientResultType.OkWithMessage, ResultValue = "No endpoint provided" };
                return false;
            }

            if (CheckAccess(endpointId)) {
                message = new { ResultType = SubmitClientResultType.AccessDenied };
                return false;
            }

            if (EndpointValidationHelper.IsHttpEndpoint(endpointId)) {
                endpointType = EndpointType.Http;
                return true;
            }

            if (EndpointValidationHelper.TryGetTelegramChatId(endpointId, out _)) {
                endpointType = EndpointType.Telegram;
                return true;
            }

            if (EndpointValidationHelper.IsMailgunEndpoint(endpointId)) {
                endpointType = EndpointType.Mailgun;
                return true;
            }

            if (EndpointValidationHelper.IsFcmEndpoint(endpointId)) {
                endpointType = EndpointType.Fcm;
                return true;
            }

            message = new { ResultType = SubmitClientResultType.NotSupportedEndpointFormat };
            return false;
        }

        private async Task<(bool, EndpointModel endpoint)> TryAddEndpoint(string endpointId, string userId, EndpointType endpointType,
            Dictionary<string, string?> parameters, CancellationToken cancellationToken) {
            var endpoint = await _db.Endpoints.FindAsync(new object[] { endpointId, userId }, cancellationToken);
            if (endpoint == null)
                return (true, _db.Endpoints.Add(new EndpointModel {
                    Endpoint = endpointId,
                    UserId = userId,
                    Parameters = parameters,
                    EndpointType = endpointType
                }).Entity);
            return (false, endpoint);
        }

        private async Task<(bool, User)> TryAddUser(string userId, CancellationToken cancellationToken) {
            var user = await _db.Users.FindAsync(new object[] { userId }, cancellationToken);
            return user == null
                ? (true, _db.Users.Add(new User { Id = userId }).Entity)
                : (false, user);
        }

        private async Task<object?> RemoveEndpoint(string userId, IReadOnlyDictionary<string, string?> parameters,
            CancellationToken cancellationToken) {
            if (!parameters.TryGetValue("mainParam", out var endpointKey) || string.IsNullOrWhiteSpace(endpointKey))
                return new { ResultType = SubmitClientResultType.OkWithMessage, ResultValue = "No endpoint to delete" };

            if (endpointKey.Equals("test", StringComparison.OrdinalIgnoreCase)) endpointKey = ComposeTestEndpointKey(userId);

            var endpoint = await _db.Endpoints.FindAsync(new object[] { endpointKey, userId }, cancellationToken);
            if (endpoint == null) return new { ResultType = SubmitClientResultType.OkWithMessage, ResultValue = "Endpoint not found" };

            _db.Endpoints.Remove(endpoint);
            await _db.SaveChangesAsync(cancellationToken);
            return new { ResultType = SubmitClientResultType.OkWithMessage, ResultValue = $"Endpoint {endpoint.Endpoint} was removed" };
        }

        private async Task<object?> ClearEndpoints(string userId, CancellationToken cancellationToken) {
            var endpoints = _db.Endpoints.Where(e => e.UserId == userId);
            _db.Endpoints.RemoveRange(endpoints);
            await _db.SaveChangesAsync(cancellationToken);
            return new { ResultType = SubmitClientResultType.OkWithMessage, ResultValue = "All endpoints was removed" };
        }

        private async Task<object?> SecretCommand(string userId,
            IReadOnlyDictionary<string, string?> parameters,
            CancellationToken cancellationToken) {
            var (_, user) = await TryAddUser(userId, cancellationToken);

            var mainParam = parameters.GetValueOrDefault("mainParam");
            string? secretKey;
            switch (mainParam) {
                case "remove" when user.SecretKey == null:
                    return new {
                        ResultType = SubmitClientResultType.OkWithMessage,
                        ResultValue = "Nothing to remove"
                    };
                case "get":
                case null:
                    return new {
                        ResultType = SubmitClientResultType.OkWithMessage,
                        ResultValue = string.IsNullOrWhiteSpace(user.SecretKey)
                            ? "No secret key"
                            : $"Your secret key: {user.SecretKey}"
                    };
                case "remove":
                    secretKey = null;
                    break;
                default:
                    secretKey = mainParam;
                    break;
            }

            user.SecretKey = secretKey;
            _db.Users.Update(user);
            await _db.SaveChangesAsync(cancellationToken);
            return new {
                ResultType = SubmitClientResultType.OkWithMessage,
                ResultValue = secretKey == null ? "Secret key was removed" : "Secret key has been set"
            };
        }

        private async Task<object> ListCommand(string userId, CancellationToken cancellationToken) {
            var endpoints = await _db.Endpoints.Where(e => e.UserId == userId).ToListAsync(cancellationToken);

            if (endpoints.Count == 0) return new { ResultType = SubmitClientResultType.NoEndpointsRegistered };

            return new { ResultType = SubmitClientResultType.ListEndpoints, ResultValue = endpoints };
        }

        private async Task<object> TestCommand(string userId,
            Dictionary<string, string?> parameters,
            CancellationToken cancellationToken) {
            // do not allow use different methods for test only post
            parameters.Remove("m");
            var endpoint = ComposeTestEndpointKey(userId);
            var isSecretRequired = await AddOrUpdateEndpoint(userId, endpoint, EndpointType.Http, parameters, cancellationToken);
            return new { Endpoint = endpoint, IsTest = true, IsSecretRequired = isSecretRequired };
        }

        private string ComposeTestEndpointKey(string userId) {
            return Url.Combine(_appOptionsAccessor.Value.Url, "test-http", userId[..12]);
        }

        private async Task<bool> AddOrUpdateEndpoint(string userId, string endpointId, EndpointType endpointType,
            Dictionary<string, string?> parameters, CancellationToken cancellationToken) {
            var (_, user) = await TryAddUser(userId, cancellationToken);

            //exclude mainParam from db
            parameters = parameters.Where(kv => kv.Key != "mainParam").ToDictionary(kv => kv.Key, kv => kv.Value);
            var (added, endpoint) = await TryAddEndpoint(endpointId, userId, endpointType, parameters, cancellationToken);
            if (!added) {
                endpoint.Parameters = parameters;
                _db.Endpoints.Update(endpoint);
            }

            await _db.SaveChangesAsync(cancellationToken);

            return endpoint.Parameters.ContainsKey("d") && string.IsNullOrWhiteSpace(user.SecretKey);
        }

        private bool CheckAccess(string endpoint) {
            return endpoint.StartsWith(_appOptionsAccessor.Value.Url, StringComparison.OrdinalIgnoreCase);
        }

        private async Task<bool> ComingSoon(ConsumeContext context) {
            if (!bool.TryParse(_configuration["COMING_SOON"], out var comingSoon) || !comingSoon) return false;
            await context.RespondAsync<SubmitClientResult>(new { ResultType = SubmitClientResultType.ComingSoon });
            return true;
        }
    }
}