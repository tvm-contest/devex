using System;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Notifon.Server.Business {
    public static class EndpointValidationHelper {
        private static readonly Regex HttpEndpointRegex = new(
            @"^http(s)?:\/\/(?!t.me\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$",
            RegexOptions.Compiled);

        private static readonly Regex TelegramChannelLinkRegex =
            new(@"^https:\/\/t.me\/(?'channel'[A-Za-z\d_-]{5,32})$", RegexOptions.Compiled);

        private static readonly Regex TelegramChatIdRegex =
            new(@"^TelegramChatId:(?'chatId'-\d{1,32})$", RegexOptions.Compiled);

        public static bool IsHttpEndpoint(string endpoint) {
            return HttpEndpointRegex.IsMatch(endpoint);
        }

        public static bool TryGetTelegramChatId(string endpoint, out string chatId) {
            var match = TelegramChannelLinkRegex.Match(endpoint);
            if (match.Success) {
                chatId = $"@{match.Groups["channel"].Value}";
                return true;
            }

            match = TelegramChatIdRegex.Match(endpoint);
            if (match.Success) {
                chatId = match.Groups["chatId"].Value;
                return true;
            }

            chatId = null;
            return false;
        }

        public static bool IsMailgunEndpoint(string endpoint) {
            try {
                var _ = new MailAddress(endpoint);
                return true;
            }
            catch (FormatException) {
                return false;
            }
        }
    }
}