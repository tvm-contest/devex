using System.Text.Json.Serialization;

namespace Server.Business.Requests
{
    public class GetServerStatusResult
    {
        [JsonPropertyName("userCount")] public int UserCount { get; init; }
    }
}