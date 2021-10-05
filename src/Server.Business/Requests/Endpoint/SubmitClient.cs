namespace Server.Requests.Endpoint
{
    public interface SubmitClient
    {
        string ClientId { get; }
        string Data { get; }
    }
}