using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;
using System.ComponentModel.DataAnnotations.Schema;
using Notifon.Server.Models;

namespace Notifon.Server.Database.Models {
    public class EndpointModel {
        [Key] [Column(Order = 0)] public string Endpoint { get; set; }
        public EndpointType EndpointType { get; set; }
        public Dictionary<string, string> Parameters { get; set; }
        [Key] [Column(Order = 1)] public string UserId { get; set; }
        public User User { get; set; }
    }
}