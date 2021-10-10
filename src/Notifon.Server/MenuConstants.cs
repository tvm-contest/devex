using Notifon.Common;
using Notifon.Server.Business.Models;
using Notifon.Server.Business.Requests.Endpoint;

namespace Notifon.Server {
    public static class MenuConstants {
        public const string EndpointExamples =
            "❗ Supported endpoints and parameters:\n" +
            "HTTP endpoint:\n" +
            "http(s)://your-domain.com/you-endpoint [-d]\n" +
            "test [-d]\n" +
            "\n" +
            "Telegram endpoint:\n" +
            "https://t.me/you_chat [-d] [-t:BOT_TOKEN]\n" +
            "TelegramChatId:CHAT_NUMBER [-d] [-t:BOT_TOKEN]\n" +
            "\n" +
            "Mailgun endpoint:\n" +
            "your-name@your-domain.com [-d] [-mf:FROM_ADDRESS] [-md:MAILGUN_DOMAIN] [-mk:MAILGUN_APIKEY] [-ms:MAILGUN_SUBJECT]\n" +
            "\n" +
            "✨ Examples commands:\n" +
            "'https://notifon.requestcatcher.com/test' just relay encrypted messages to HTTP endpoint\n" +
            "\n" +
            "'https://notifon.requestcatcher.com/test -d' decrypt messages with SECRET_KEY and send it to HTTP endpoint\n" +
            "\n" +
            "'https://t.me/free_ton_notification' relay encrypted messages to @free_ton_notification uses @free_ton_notify_bot as default bot\n" +
            "\n" +
            "'https://t.me/you_chat -t:BOT_TOKEN' send encrypted messages to you_chat uses custom bot(ensure that bot was added to the chat)\n" +
            "\n" +
            "'TelegramChatId:-123456789 -d -t:BOT_TOKEN' send decrypt messages to chat -123456789(usefull for private group)\n" +
            "\n" +
            "'your@email.com -f:notifon@notifon.com; -md:notifon.com; -mk:MAILGUN_APIKEY' decrypt message with SECRET_KEY and send to your@email.com from notifon@notifon.com uses notifon.com domain and MAILGUN_APIKEY\n" +
            "\n" +
            "'test -d' send decrypted messages to test endpoint";

        public static readonly string ContactUs = $"\n💬 Chat us if you have any questions {ProjectConstants.TelegramLink}";

        public static readonly string SomethingWentWrong =
            "🚨 Oops Something went wrong 😱\n" +
            "Client hash: {0}\n" +
            "Contact us to get help https://t.me/ton_actions_chat\n" +
            "Also you can pass \"test\" keyword as callback url to test this provider";

        public static readonly string HelpCommand =
            "❓ Available commands:\n" +
            CommandHelpers.CommandDescriptions + "\n" +
            EndpointExamples + "\n" +
            ContactUs;

        public static readonly string NoEndpointsRegistered =
            "🪹 Your have no registered endpoints\n" +
            "Use 'help' to get available options\n" +
            ContactUs;

        public static readonly string AccessDenied =
            "🚫 Access denied!\n" +
            "Pass 'test' as callback url to test this provider\n" +
            ContactUs;

        public static readonly string NotSupportedEndpointFormat =
            "🔍 Wrong endpoint. Supported formats:\n" +
            " - HTTP notifications starting with http:// or https://\n" +
            " - Telegram notifications https://t.me/{channel_id}\n" +
            " - Emails notification youname@youdomain.com" + "\n" +
            ContactUs;

        public static readonly string ComingSoon =
            "🌙 Coming soon..." +
            ContactUs;

        public static string FormatSubmitClientSuccessMessage(SubmitClientSuccess success) {
            return "👍 Looks good!\n" +
                   $"Notifications will be sent to {success.Endpoint}" +
                   (success.IsTest ? "(can be open in web browser)" : null) + "\n" +
                   "Now your can set rules for catching blockchain messages 🖐️";
        }
    }
}