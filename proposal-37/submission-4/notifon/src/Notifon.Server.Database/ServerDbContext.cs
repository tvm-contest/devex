using Microsoft.EntityFrameworkCore;
using Notifon.Server.Database.Models;

namespace Notifon.Server.Database {
    public class ServerDbContext : DbContext {
        public ServerDbContext(DbContextOptions options) : base(options) { }

        public DbSet<User> Users { get; set; }
        public DbSet<EndpointModel> Endpoints { get; set; }

        protected override void OnModelCreating(ModelBuilder modelBuilder) {
            modelBuilder.Entity<EndpointModel>().HasKey(e => new { e.Endpoint, e.UserId });

            modelBuilder.Entity<EndpointModel>()
                .Property(b => b.Parameters)
                .HasJsonConversion();
        }
    }
}