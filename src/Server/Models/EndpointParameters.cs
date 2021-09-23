using System.ComponentModel.DataAnnotations;

namespace Server.Models
{
    public class EndpointParameters
    {
        [Required(AllowEmptyStrings = false)]
        public string Hash { get; set; }
        
        [Required(AllowEmptyStrings = false)]
        public string Data { get; set; }
    }
}