using Notifon.Server.Business.Models;

namespace Notifon.Server.Business.Requests.TonClient {
    public interface FormatDecryptedMessage {
        DecryptedMessage Message { get; }
        string Format { get; }
    }
}