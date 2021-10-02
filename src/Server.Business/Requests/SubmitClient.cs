namespace Server.Requests
{
    public interface SubmitClient
    {
        string Hash { get; }
        string Endpoint { get; }
    }
}