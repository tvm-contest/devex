using Notifon.Server.Business.Models;

namespace Notifon.Server.Business.Notifications {
    public interface SendSubscription {
        string ClientId { get; }
        SubscriptionMessage Message { get; set; }
    }
}