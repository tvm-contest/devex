using System.Text.Json.Serialization;

namespace Shared.Requests
{
    public class GetServerStatusResult
    {
        [JsonPropertyName("userCount")] public int UserCount { get; init; }
    }
}