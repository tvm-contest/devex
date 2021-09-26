namespace Server.Business.SubmitClientInfoCommand
{
    public interface SubmitClientInfo
    {
        string Hash { get; }
        string Endpoint { get; }
    }
}