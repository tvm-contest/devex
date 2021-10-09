using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class MailgunEndpoint {
        private MailgunEndpoint(string to) {
            To = to;
        }

        public string To { get; }

        public static MailgunEndpoint FromPublishMessage(PublishMessage @base) {
            return new MailgunEndpoint(@base.Endpoint);
        }
    }
}