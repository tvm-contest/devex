using Azure.Data.Tables;

namespace NotificationProvider.Functions
{
    public class TableClient<T> : TableClient
    {
        public TableClient(string connectionString, string tableName = null)
            : base(connectionString, tableName ?? typeof(T).Name) { }
    }
}
