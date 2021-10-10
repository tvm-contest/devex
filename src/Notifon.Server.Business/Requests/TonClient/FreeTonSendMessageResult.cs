namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonSendMessageResult {
        public bool Success { get; init; }
        public string[] Messages { get; init; }
        public string Error { get; init; }
        public decimal Balance { get; set; }
    }
}