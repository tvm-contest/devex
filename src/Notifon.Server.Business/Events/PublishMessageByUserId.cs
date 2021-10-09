using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public interface PublishMessageByUserId {
        string UserId { get; }
        SubscriptionMessage Message { get; }
    }
}