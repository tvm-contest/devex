using System;

namespace Notifon.Server.Business.Exceptions {
    public class NoFirebaseMessagingException : Exception {
        public NoFirebaseMessagingException(string message) : base(message) { }
    }
}