using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class FcmEndpoint {
        private FcmEndpoint(string token) {
            Token = token;
        }

        public string Token { get; }

        public static FcmEndpoint FromPublishMessage(PublishMessage @base) {
            return new FcmEndpoint(@base.Endpoint.Split(':', 2)[1]);
        }
    }
}