using Microsoft.EntityFrameworkCore;

namespace Notifon.Server.Database {
    public class ServerDbContext : DbContext {
        public ServerDbContext(DbContextOptions options) : base(options) { }

        public DbSet<ClientInfo> ClientInfos { get; set; }
    }
}