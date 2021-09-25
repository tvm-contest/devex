using System.IO;
using MassTransit;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Microsoft.OpenApi.Models;
using Serilog;
using Server.Business;
using Server.Database;
using Server.Kafka;
using Server.SignalR;

namespace Server
{
    public class Startup
    {
        public Startup(IConfiguration configuration)
        {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services)
        {
            services.AddControllersWithViews(options => { options.InputFormatters.Insert(options.InputFormatters.Count, new TextPlainInputFormatter()); });
            services.AddRazorPages();
            services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new OpenApiInfo
                {
                    Title = "HTTP Notification Provider API",
                    Version = "v1"
                });
            });

            services
                .Configure<RouteOptions>(options => options.LowercaseUrls = true)
                .Configure<KafkaOptions>(Configuration.GetSection(nameof(KafkaOptions)));

            services
                .AddMediator(k => k.AddConsumers(typeof(SubmitClientInfoConsumer).Assembly))
                .AddMassTransit(k =>
                {
                    k.UsingInMemory();
                    k.AddRider(RiderRegistrationConfiguratorExtensions.UsingKafka);
                })
                .AddMassTransitHostedService();

            services.AddHttpClient();
            services.AddSignalR();
            services.AddDbContextFactory<ServerDbContext>(UseSqlLite);
            services.AddSingleton<IDistributedCache, RedisCache>()
                .Configure<RedisCacheOptions>(options => options.Configuration = "localhost");
            services.AddSingleton<IDistributedLock, RedisLock>()
                .Configure<RedisLockOptions>(options => options.Configuration = "localhost");
        }

        private static void UseSqlLite(DbContextOptionsBuilder options)
        {
            var path = Directory.GetCurrentDirectory();
            var dbPath = Path.Join(path, "Data", "server.db");
            options.UseSqlite($"Data Source={dbPath}");
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env)
        {
            if (env.IsDevelopment())
            {
                app.UseDeveloperExceptionPage();
                app.UseWebAssemblyDebugging();
            }
            else
            {
                app.UseExceptionHandler("/Error");
            }

            app.UseSerilogRequestLogging();

            app.UseCors(builder => builder.AllowAnyOrigin());

            app.UseSwagger();
            app.UseSwaggerUI(c => c.SwaggerEndpoint("/swagger/v1/swagger.json", "WebAPI v1"));

            app.UseBlazorFrameworkFiles();
            app.UseStaticFiles();

            app.UseRouting();

            app.UseEndpoints(endpoints =>
            {
                endpoints.MapRazorPages();
                endpoints.MapControllers();
                endpoints.MapHub<TestConsumerHub>("/test-consumer-hub");
                endpoints.MapFallbackToFile("index.html");
            });
        }
    }
}