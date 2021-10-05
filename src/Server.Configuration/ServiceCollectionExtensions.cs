using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Server.Options;

namespace Server
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection ConfigureOptions(this IServiceCollection services, IConfiguration configuration)
        {
            services
                .Configure<KafkaOptions>(configuration.GetSection(Constants.KafkaOptions))
                .Configure<RedisCacheOptions>(configuration.GetSection(Constants.RedisOptions))
                .Configure<RedisLockOptions>(configuration.GetSection(Constants.RedisOptions))
                .Configure<RabbitMqOptions>(configuration.GetSection(Constants.RabbitMqOptions))
                .Configure<MailGunOptions>(configuration.GetSection(Constants.MailGunOptions));
            return services;
        }
    }
}