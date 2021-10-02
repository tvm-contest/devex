namespace Server.Requests
{
    public interface SubmitClientError
    {
        SubmitClientErrorType ErrorType { get; }
    }
}