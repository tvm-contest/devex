namespace Server.Business.Requests
{
    public interface SubmitClientError
    {
        SubmitClientErrorType ErrorType { get; }
    }
}