namespace Server.Business.Requests
{
    public interface SubmitClientSuccess
    {
        string Endpoint { get; }
        bool IsTest { get; }
    }
}