using System.ComponentModel.DataAnnotations;

namespace Notifon.Server.Database {
    // ReSharper disable once ClassNeverInstantiated.Global
    public class ClientInfo {
        [Key] public string ClientId { get; set; }

        [Required(AllowEmptyStrings = false)] public string Endpoint { get; set; }

        public string SecretKey { get; set; }
    }
}