using System;

namespace Notifon.Server.Business.Models {
    public class CommandDescriptionAttribute : Attribute {
        public CommandDescriptionAttribute(string command, string description) {
            Command = command;
            Description = description;
        }

        public string Command { get; }
        public string Description { get; }
    }
}