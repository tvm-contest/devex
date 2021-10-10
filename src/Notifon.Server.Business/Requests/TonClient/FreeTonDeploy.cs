using System.ComponentModel.DataAnnotations;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonDeploy {
        [Required] public string Phrase { get; init; }
    }
}