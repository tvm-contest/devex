namespace Server.Business.Requests
{
    public interface SubmitClient
    {
        string Hash { get; }
        string Endpoint { get; }
    }
}