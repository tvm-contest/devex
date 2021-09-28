using System;
using System.IO;
using HealthChecks.Redis;
using MassTransit;
using MassTransit.PrometheusIntegration;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Caching.StackExchangeRedis;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Diagnostics.HealthChecks;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Prometheus;
using Serilog;
using Server.Business.Requests;
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
            services.AddSwaggerDocument();

            services.AddCors(o => o.AddPolicy("SubmitEndpoint", builder => builder.AllowAnyOrigin()));

            services
                .Configure<RouteOptions>(options => options.LowercaseUrls = true)
                .Configure<KafkaOptions>(Configuration.GetSection(nameof(KafkaOptions)));

            services
                .AddMediator(k => k.AddConsumers(typeof(SubmitClientInfoConsumer).Assembly))
                .AddMassTransit(k =>
                {
                    k.SetKebabCaseEndpointNameFormatter();
                    k.UsingInMemory((_, configurator) => configurator.UsePrometheusMetrics());
                    k.AddRider(RiderRegistrationConfiguratorExtensions.UsingKafka);
                })
                .AddMassTransitHostedService();

            services.AddHttpClient();

            services.AddSignalR();
            services.AddSingleton<IUserIdProvider, ByHashUserIdProvider>();

            //setup database
            services.AddDbContextFactory<ServerDbContext>(UseSqlLite)
                .AddDbContext<ServerDbContext>();
            services.AddHealthChecks()
                .AddDbContextCheck<ServerDbContext>();

            //setup lock and cache
            services.AddSingleton<IDistributedCache, RedisCache>()
                .Configure<RedisCacheOptions>(options => options.Configuration = "localhost");
            services.AddSingleton<IDistributedLock, RedisLock>()
                .Configure<RedisLockOptions>(options => options.Configuration = "localhost");
            services.AddHealthChecks()
                .Add(new HealthCheckRegistration("redis", (Func<IServiceProvider, IHealthCheck>)(sp =>
                {
                    var redisConfiguration = sp.GetRequiredService<IOptions<RedisCacheOptions>>().Value.Configuration;
                    return new RedisHealthCheck(redisConfiguration);
                }), null, null, null));
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

            app.UseOpenApi();
            app.UseSwaggerUi3();

            app.UseBlazorFrameworkFiles();
            app.UseStaticFiles();

            app.UseRouting()
                .UseCors()
                .UseEndpoints(endpoints =>
                {
                    endpoints.MapRazorPages();
                    endpoints.MapControllers();
                    endpoints.MapHub<TestConsumerHub>("/test-consumer-hub");
                    endpoints.MapFallbackToFile("index.html");
                    endpoints.MapHealthChecks("/health");
                    endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
                    {
                        Predicate = check => check.Tags.Contains("ready"),
                    });
                    endpoints.MapMetrics();
                });
        }
    }
}