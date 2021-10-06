namespace Server.Requests.Endpoint
{
    public interface SubmitClientResult
    {
        SubmitClientResultType ResultType { get; }
        string Message { get; }
    }
}