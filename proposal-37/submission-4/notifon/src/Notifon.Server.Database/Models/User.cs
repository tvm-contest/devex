using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace Notifon.Server.Database.Models {
    // ReSharper disable once ClassNeverInstantiated.Global
    public class User {
        [Key] public string Id { get; set; }
        public List<EndpointModel> Endpoints { get; set; }
        public string SecretKey { get; set; }
    }
}