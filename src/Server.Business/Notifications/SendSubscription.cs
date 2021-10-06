using Server.Models;

namespace Server.Notifications {
    public interface SendSubscription {
        string ClientId { get; }
        SubscriptionMessage Message { get; set; }
    }
}