using Notifon.Server.Models;

namespace Notifon.Server.Business.Requests {
    public interface SendMessageByUserId {
        string UserId { get; }
        SubscriptionMessage Message { get; }
    }
}