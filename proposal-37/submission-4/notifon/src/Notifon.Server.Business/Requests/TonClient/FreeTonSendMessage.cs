using System.ComponentModel.DataAnnotations;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonSendMessage {
        [Required] public string Phrase { get; init; }

        [Required] public string Recipient { get; init; }

        [Required] public string Message { get; init; }
    }
}