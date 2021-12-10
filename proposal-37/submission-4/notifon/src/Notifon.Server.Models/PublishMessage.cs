using System.Collections.Generic;

namespace Notifon.Server.Models {
    public interface PublishMessage {
        public string Endpoint { get; }
        public EndpointType EndpointType { get; }
        public Dictionary<string, string> Parameters { get; }
        public SubscriptionMessage Message { get; set; }
        public string SecretKey { get; }
    }
}