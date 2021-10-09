using System;
using System.Collections.Generic;
using System.Linq;
using Notifon.Server.Utils;

namespace Notifon.Server.Business {
    public static class CommandHelpers {
        public static readonly IReadOnlyDictionary<CommandType, CommandDescriptionAttribute> DescriptionByCommandType =
            Enum.GetValues<CommandType>()
                .Select(commandType => new
                    { type = commandType, description = commandType.GetAttributeOfType<CommandDescriptionAttribute>() })
                .ToDictionary(arg => arg.type, arg => arg.description);

        public static readonly string CommandDescription =
            string.Join('\n',
                DescriptionByCommandType
                    .Select(kv => {
                        var (_, descriptionAttribute) = kv;
                        var description = descriptionAttribute.Description.Replace("{command}", descriptionAttribute.Command);
                        return $" - {description}";
                    }));
    }
}