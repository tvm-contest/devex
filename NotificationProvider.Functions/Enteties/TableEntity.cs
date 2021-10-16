using System;
using Azure;
using Azure.Data.Tables;

namespace NotificationProvider.Functions.Enteties
{
    public record TableEntity : ITableEntity
    {
        public string PartitionKey { get; set; }
        public string RowKey { get; set; }
        public DateTimeOffset? Timestamp { get; set; }
        public ETag ETag { get; set; }
    }
}
