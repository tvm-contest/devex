using System.Collections.Generic;
using System.Linq;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Models;
using Notifon.Server.Business.Requests.Endpoint;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Database.Models;

namespace Notifon.Server {
    public class MenuHelper {
        public const string CommonParameters =
            "Common decrypt parameter(set secret key for decryption):\n" +
            "-d decrypt message and send it as json\n" +
            "-d:body decrypt message and send comment of internal or json body of external\n";

        public const string EndpointExamples =
            "❗ Supported endpoints and parameters:\n" +
            "HTTP endpoint:\n" +
            "http(s)://your-domain.com/you-endpoint [-d[:body]]\n" +
            "test [-d[:body]]\n" +
            "\n" +
            "Telegram endpoint:\n" +
            "https://t.me/you_chat [-d[:body]] [-t:BOT_TOKEN]\n" +
            "TelegramChatId:CHAT_NUMBER [-d[:body]] [-t:BOT_TOKEN]\n" +
            "\n" +
            "Mailgun endpoint:\n" +
            "your-name@your-domain.com [-d[:body]] [-mf:FROM_ADDRESS] [-md:MAILGUN_DOMAIN] [-mk:MAILGUN_APIKEY] [-ms:MAILGUN_SUBJECT]\n" +
            "\n" +
            "✨ Examples commands:\n" +
            "'https://notifon.requestcatcher.com/test' just relay encrypted messages to HTTP endpoint\n" +
            "\n" +
            "'https://notifon.requestcatcher.com/test -d' decrypt messages with SECRET_KEY and post it to HTTP endpoint\n" +
            "\n" +
            "'https://t.me/free_ton_notification' relay encrypted messages to @free_ton_notification uses @free_ton_notify_bot as default bot\n" +
            "\n" +
            "'https://t.me/you_chat -t:BOT_TOKEN' send encrypted messages to you_chat uses custom bot(ensure that bot was added to the chat)\n" +
            "\n" +
            "'TelegramChatId:-123456789 -d:body -t:BOT_TOKEN' send decrypted body to chat -123456789(usefull for private group)\n" +
            "\n" +
            "'your@email.com -f:notifon@notifon.com; -md:notifon.com; -mk:MAILGUN_APIKEY' decrypt message with SECRET_KEY and send to your@email.com from notifon@notifon.com uses notifon.com domain and MAILGUN_APIKEY\n" +
            "\n" +
            "'test -d:body' send decrypted body of internal message or json of ext";

        public const string SomethingWentWrong =
            "🚨 Oops Something went wrong 😱\n" +
            "Client hash: {0}\n" +
            "Contact us to get help https://t.me/ton_actions_chat\n";

        private readonly AppOptions _appOptions;

        public MenuHelper(IOptions<AppOptions> appOptionsAccessor) {
            _appOptions = appOptionsAccessor.Value;
        }

        public string ContactUs =>
            $"\n💬 Chat us if you have any questions {_appOptions.Telegram}";

        public string HelpCommand =>
            "❓ Available commands:\n" +
            CommandHelpers.CommandDescriptions + "\n\n" +
            CommonParameters + "\n" +
            EndpointExamples + "\n" +
            ContactUs;

        public string NoEndpointsRegistered =>
            "🪹 Your have no registered endpoints\n" +
            "Use 'help' to get available options\n" +
            ContactUs;

        public string AccessDenied =>
            "🚫 Access denied!\n" +
            "Pass 'test' as callback url to test this provider\n" +
            ContactUs;

        public string NotSupportedEndpointFormat =>
            "🔍 Wrong endpoint. Supported formats:\n" +
            " - HTTP notifications starting with http:// or https://\n" +
            " - Telegram notifications https://t.me/{chat_key} or TelegramChatId:{chat_id}(useful for private group)\n" +
            " - Emails notification youname@youdomain.com" + "\n" +
            "pass 'help' as callback to get full description" + "\n" +
            ContactUs;

        public string ComingSoon =>
            "🌙 Coming soon..." +
            ContactUs;

        public static string FormatSubmitClientSuccessMessage(SubmitClientSuccess success) {
            return "👍 Looks good!\n" +
                   $"Notifications will be sent to {success.Endpoint}" +
                   (success.IsTest ? "(can be open in web browser)" : null) + "\n" +
                   "Now your can set rules for catching blockchain messages 🖐️";
        }

        public static string ListEndpoints(IEnumerable<EndpointModel> endpoints) {
            var endpointStrings = endpoints.Select(e => $"{e.Endpoint} {GetEndpointParametersString(e.Parameters)}");
            return "Registered endpoints:\n" +
                   string.Join('\n', endpointStrings);
        }

        private static string GetEndpointParametersString(Dictionary<string, string> parameters) {
            return string.Join(' ', parameters.Select(p => $"-{p.Key}{(p.Value == null ? null : ':')}{p.Value}"));
        }
    }
}