using System;
using Microsoft.AspNetCore.SignalR;

namespace Server
{
    public class ByHashUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            var context = connection.GetHttpContext();
            if (context == null)
                return null;

            if (context.Request.Query.TryGetValue("UserId", out var userId))
                return userId.ToString();

            throw new UnauthorizedAccessException("UserId is not defined");
        }
    }
}