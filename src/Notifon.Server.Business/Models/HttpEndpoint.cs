using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class HttpEndpoint {
        private HttpEndpoint(string url) {
            Url = url;
        }

        public string Url { get; }

        public static HttpEndpoint FromPublishMessage(PublishMessage @base) {
            return new HttpEndpoint(@base.Endpoint);
        }
    }
}