using System.IO;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;

namespace Server
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddDatabase(this IServiceCollection services, string postgreSqlConnectionString)
        {
            services.AddDbContextFactory<ServerDbContext>(builder =>
                {
                    if (postgreSqlConnectionString != null)
                    {
                        builder.UseNpgsql(postgreSqlConnectionString);
                        return;
                    }

                    UseSqlLite(builder);
                })
                .AddDbContext<ServerDbContext>()
                .AddHealthChecks()
                .AddDbContextCheck<ServerDbContext>();
            return services;
        }

        private static void UseSqlLite(DbContextOptionsBuilder options)
        {
            var path = Directory.GetCurrentDirectory();
            var appData = Path.Join(path, "App_Data");
            if (!Directory.Exists(appData))
            {
                Directory.CreateDirectory(appData);
            }

            var dbPath = Path.Join(appData, "app.db");
            options.UseSqlite($"Data Source={dbPath}");
        }
    }
}