using System;
using System.Collections.Generic;
using Notifon.Server.Business.Exceptions;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class TelegramParameters {
        private TelegramParameters(string text, string chatId, string botToken) {
            Text = text;
            ChatId = chatId;
            BotToken = botToken;
        }

        public string Text { get; }
        public string ChatId { get; }
        public string BotToken { get; }

        /// <exception cref="WrongEndpointFormatException"></exception>
        /// <exception cref="NoRequiredParametersException"></exception>
        public static TelegramParameters Create(PublishMessage message, Func<TelegramOptions> telegramOptionsFactory) {
            if (!EndpointValidationHelper.TryGetTelegramChatId(message.Endpoint, out var chatId))
                throw new WrongEndpointFormatException(message.Endpoint);

            var botToken = message.Parameters.GetValueOrDefault("t") ?? telegramOptionsFactory().BotToken;
            if (string.IsNullOrWhiteSpace(botToken)) throw new NoRequiredParametersException();

            return new TelegramParameters(message.Message.Text, chatId, botToken);
        }
    }
}