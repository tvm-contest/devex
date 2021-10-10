#nullable enable
using System;
using System.Collections.Generic;
using System.Linq;

namespace Notifon.Server.Business.Models {
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
            Dictionary<string, string?> parameters = new();

            var split = data.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);

            string paramString;
            if (split.Length > 0 && !split[0].Trim().StartsWith('-')) {
                parameters.Add("mainParam", split[0]);
                paramString = split.Length == 2 ? split[1] : string.Empty;
            }
            else {
                paramString = data;
            }

            foreach (var p in paramString.Split("-", StringSplitOptions.RemoveEmptyEntries)) {
                string[] pSplit = p.Split(':', 2);
                if (pSplit.Length == 0) continue;

                string key = pSplit[0].Trim();
                var value = pSplit.Length == 2 ? pSplit[1].Trim() : null;

                parameters.TryAdd(key, value);
            }

            return parameters;
        }

        private static CommandType GetCommandType(string data) {
            var split = data.Split(' ', 2, StringSplitOptions.RemoveEmptyEntries);

            if (split.Length == 0 || string.IsNullOrWhiteSpace(split[0])) return DefaultCommand;

            return CommandHelpers
                .DescriptionByCommandType
                .SingleOrDefault(description => {
                    var command = description.Value.Command;
                    return command != null && split[0].Equals(command, StringComparison.OrdinalIgnoreCase);
                })
                .Key;
        }
    }
}