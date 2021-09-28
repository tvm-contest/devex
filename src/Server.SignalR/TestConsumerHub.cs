using System.Threading.Tasks;
using Microsoft.AspNetCore.SignalR;

namespace Server.SignalR
{
    public class TestConsumerHub : Hub
    {
        public override Task OnConnectedAsync()
        {
            return base.OnConnectedAsync();
        }
    }
}