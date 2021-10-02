using System;
using Microsoft.AspNetCore.SignalR;

namespace Server.SignalR
{
    public class ByHashUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            connection.UserIdentifier = connection
                .GetHttpContext()?
                .Request.Query.TryGetValue("UserId", out var userId) ?? false
                ? userId.ToString()
                : throw new UnauthorizedAccessException("UserId is not defined");

            return connection.UserIdentifier;
        }
    }
}