namespace Server.Requests.Endpoint {
    public interface SubmitClientSuccess {
        string Endpoint { get; }
        bool IsTest { get; }
    }
}