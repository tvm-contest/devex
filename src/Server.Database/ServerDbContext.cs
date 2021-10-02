using Microsoft.EntityFrameworkCore;

namespace Server
{
    public class ServerDbContext : DbContext
    {
        public ServerDbContext(DbContextOptions options) : base(options)
        {
        }

        public DbSet<ClientInfo> ClientInfos { get; set; }
    }
}