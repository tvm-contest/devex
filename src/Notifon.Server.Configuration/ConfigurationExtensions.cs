using System.Linq;
using Microsoft.Extensions.Configuration;

namespace Notifon.Server.Configuration {
    public static class ConfigurationExtensions {
        public static bool ContainsRabbitMqOptions(this IConfiguration configuration) {
            return configuration.GetChildren().FirstOrDefault(s => s.Key == Sections.RabbitMq) != null;
        }

        public static bool ContainsRedisOptions(this IConfiguration configuration) {
            return configuration.GetChildren().FirstOrDefault(s => s.Key == Sections.Redis) != null;
        }

        public static string GetPostgreSqlConnectionString(this IConfiguration configuration) {
            return configuration?.GetSection(Sections.PostgreSqlOptions)?["ConnectionString"];
        }
    }
}