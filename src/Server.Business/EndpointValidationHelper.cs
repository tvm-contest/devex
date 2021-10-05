using System;
using System.Net.Mail;
using System.Text.RegularExpressions;

namespace Server
{
    public static class EndpointValidationHelper
    {
        private static readonly Regex HttpEndpointRegex = new(@"^http(s)?:\/\/(?!t.me\/)[\w.-]+(?:\.[\w\.-]+)+[\w\-\._~:/?#[\]@!\$&'\(\)\*\+,;=.]+$",
            RegexOptions.Compiled);

        private static readonly Regex TelegramEndpointRegex = new(@"^https:\/\/t.me\/(?'channel'[A-Za-zd_]{5,32})$");

        public static bool IsHttpEndpoint(string endpoint)
        {
            return HttpEndpointRegex.IsMatch(endpoint);
        }

        public static bool TryGetTelegramEndpoint(string endpoint, out string channel)
        {
            var match = TelegramEndpointRegex.Match(endpoint);
            if (!match.Success)
            {
                channel = null;
                return false;
            }

            channel = match.Groups["channel"].Value;
            return true;
        }

        public static bool IsEmailEndpoint(string endpoint)
        {
            try
            {
                var _ = new MailAddress(endpoint);
                return true;
            }
            catch (FormatException)
            {
                return false;
            }
        }
    }
}