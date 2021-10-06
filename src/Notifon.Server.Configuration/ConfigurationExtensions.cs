using System.Linq;
using Microsoft.Extensions.Configuration;

namespace Notifon.Server.Configuration {
    public static class ConfigurationExtensions {
        public static bool ContainsRabbitMqOptions(this IConfiguration configuration) {
            return configuration.GetChildren().FirstOrDefault(s => s.Key == Constants.RabbitMqOptions) != null;
        }

        public static bool ContainsRedisOptions(this IConfiguration configuration) {
            return configuration.GetChildren().FirstOrDefault(s => s.Key == Constants.RedisOptions) != null;
        }

        public static string GetPostgreSqlConnectionString(this IConfiguration configuration) {
            return configuration.GetConnectionString(Constants.PostgreSql);
        }
    }
}