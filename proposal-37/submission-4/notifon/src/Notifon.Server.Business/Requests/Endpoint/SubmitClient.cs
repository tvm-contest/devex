namespace Notifon.Server.Business.Requests.Endpoint {
    public interface SubmitClient {
        string UserId { get; }
        string Data { get; }
    }
}