using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Server.Database;

namespace Server
{
    internal static class HostExtensions
    {
        public static IHost ApplyDatabaseMigrations(this IHost host)
        {
            using var scope = host.Services.CreateScope();
            var db = scope.ServiceProvider.GetRequiredService<IDbContextFactory<ServerDbContext>>();
            using var context = db.CreateDbContext();
            context.Database.Migrate();
            return host;
        }
    }
}