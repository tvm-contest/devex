namespace Notifon.Server.Models {
    public static class EndpointExtensions {
        public static bool ContainsDecryptParameter(this PublishMessage message) {
            return message.Parameters.ContainsKey("d");
        }
    }
}