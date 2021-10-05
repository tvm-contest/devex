namespace Server.Requests.Endpoint
{
    public interface SubmitClient
    {
        string Hash { get; }
        string Endpoint { get; }
    }
}