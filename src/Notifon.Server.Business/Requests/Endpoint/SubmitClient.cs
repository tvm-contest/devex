namespace Notifon.Server.Business.Requests.Endpoint {
    public interface SubmitClient {
        string ClientId { get; }
        string Data { get; }
    }
}