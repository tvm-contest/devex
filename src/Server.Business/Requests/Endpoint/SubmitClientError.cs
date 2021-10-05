namespace Server.Requests.Endpoint
{
    public interface SubmitClientError
    {
        SubmitClientErrorType ErrorType { get; }
    }
}