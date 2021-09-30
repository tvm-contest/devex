using System;

namespace Client.Storage
{
    // ReSharper disable once ClassNeverInstantiated.Global
    public record MessageInfo
    {
        public DateTime DateTime { get; init; }
        public string Message { get; init; }
    }
}