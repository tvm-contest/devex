using System;

namespace Notifon.Server.Business.Exceptions {
    public sealed class WrongEndpointFormatException : Exception {
        public WrongEndpointFormatException(string endpoint) : base("Wrong endpoint format ") {
            Data.Add("Endpoint", endpoint);
        }
    }
}