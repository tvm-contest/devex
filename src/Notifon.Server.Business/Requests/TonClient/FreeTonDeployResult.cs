using ch1seL.TonNet.Client.Models;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonDeployResult {
        public bool Success { get; init; }
        public string Error { get; init; }
        public decimal Balance { get; set; }
        public string Address { get; set; }
        public KeyPair KeyPair { get; set; }
    }
}