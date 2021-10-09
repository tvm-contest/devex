#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace Notifon.Server.Business {
    public class Command {
        private const CommandType DefaultCommand = CommandType.ListEndpoints;

        private Command(CommandType commandType, Dictionary<string, string?> parameters) {
            CommandType = commandType;
            Parameters = parameters;
        }

        public CommandType CommandType { get; }
        public Dictionary<string, string?> Parameters { get; }

        public static Command FromData(string data) {
            data = data.Split('\n', 1)[0].Trim();

            var command = GetCommandType(data);
            var parameters = GetCommandParameters(command, data);

            return new Command(command, parameters);
        }

        private static Dictionary<string, string?> GetCommandParameters(CommandType commandType, string data) {
            switch (commandType) {
                case CommandType.AddEndpoint:
                    return GetParameters(data);
                case CommandType.RemoveEndpoint:
                case CommandType.Secret:
                case CommandType.Test:
                    var split = data.Split(' ', 2);
                    return GetParameters(split.Length == 2 ? split[1] : string.Empty);
                case CommandType.Help:
                case CommandType.ListEndpoints:
                case CommandType.ClearEndpoints:
                    return new Dictionary<string, string?>();
                default:
                    throw new ArgumentOutOfRangeException(nameof(commandType), commandType, null);
            }
        }

        private static Dictionary<string, string?> GetParameters(string data) {
            return data.Split(' ')
                .Where(p => !string.IsNullOrWhiteSpace(p))
                .Select(p => {
                    if (!p.StartsWith('-'))
                        return new { key = "mainParam", value = (string?)p };
                    var pSplit = p.Split(':', 2);
                    var key = pSplit[0].TrimStart('-');
                    var value = pSplit.Length == 2 ? pSplit[1] : null;
                    return new { key, value };
                })
                .ToDictionary(arg => arg.key, arg => arg.value);
        }

        private static CommandType GetCommandType(string data) {
            var split = data.Split(' ', 2)[0];

            if (string.IsNullOrWhiteSpace(split)) return DefaultCommand;

            return CommandHelpers
                .DescriptionByCommandType
                .SingleOrDefault(description => {
                    var command = description.Value.Command;
                    return command != null && split.Equals(command, StringComparison.OrdinalIgnoreCase);
                })
                .Key;
        }
    }
}