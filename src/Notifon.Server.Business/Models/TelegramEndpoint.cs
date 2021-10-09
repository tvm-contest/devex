using Notifon.Server.Business.Exceptions;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class TelegramEndpoint {
        private TelegramEndpoint(string channelId) {
            ChannelId = channelId;
        }

        public string ChannelId { get; }

        public static TelegramEndpoint FromPublishMessage(PublishMessage @base) {
            if (EndpointValidationHelper.TryGetTelegramEndpoint(@base.Endpoint, out var channelId)) return new TelegramEndpoint(channelId);
            throw new WrongEndpointFormatException(@base.Endpoint);
        }
    }
}