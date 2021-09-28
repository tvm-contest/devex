using Microsoft.AspNetCore.SignalR;

namespace Server.SignalR
{
    public class ByHashUserIdProvider : IUserIdProvider
    {
        public string GetUserId(HubConnectionContext connection)
        {
            connection.UserIdentifier = connection.GetHttpContext()?.Request.Headers["Consumer"];
            return connection.UserIdentifier;
        }
    }
}