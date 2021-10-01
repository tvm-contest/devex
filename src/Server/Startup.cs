using System;
using System.IO;
using System.Linq;
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
using NSwag;
using Prometheus;
using Serilog;
using Server.Business.Requests;
using Server.Database;
using Server.Kafka;
using Server.SignalR;
using Shared;

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
            services.AddSwaggerDocument(settings => { settings.Title = ProjectConstants.AppName; });

            services.AddCors(o => o.AddPolicy("SubmitEndpoint", builder => builder.AllowAnyOrigin()));

            services
                .Configure<RouteOptions>(options => options.LowercaseUrls = true)
                .Configure<KafkaOptions>(Configuration.GetSection(nameof(KafkaOptions)));

            services
                .AddMediator(k => k.AddConsumers(typeof(SubmitClientConsumer).Assembly))
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
            services.AddDbContextFactory<ServerDbContext>(builder =>
                {
                    var postgreSqlConnectionString = Configuration.GetConnectionString("PostgreSql");
                    if (postgreSqlConnectionString != null)
                    {
                        builder.UseNpgsql(postgreSqlConnectionString);
                        return;
                    }

                    UseSqlLite(builder);
                })
                .AddDbContext<ServerDbContext>();
            services.AddHealthChecks()
                .AddDbContextCheck<ServerDbContext>();

            //setup distributed lock and cache
            if (Configuration.GetChildren().FirstOrDefault(s => s.Key == "RedisOptions") != null)
            {
                services.AddSingleton<IDistributedCache, RedisCache>()
                    .Configure<RedisCacheOptions>(Configuration.GetSection("RedisOptions"))
                    .AddSingleton<IDistributedLock, RedisLock>()
                    .Configure<RedisLockOptions>(Configuration.GetSection("RedisOptions"))
                    .AddHealthChecks()
                    .Add(new HealthCheckRegistration("redis", (Func<IServiceProvider, IHealthCheck>)(sp =>
                    {
                        var redisConfiguration = sp.GetRequiredService<IOptions<RedisCacheOptions>>().Value.Configuration;
                        return new RedisHealthCheck(redisConfiguration);
                    }), null, null, null));
            }
            else
            {
                services.AddSingleton<IDistributedCache, MemoryDistributedCache>();
                services.AddSingleton<IDistributedLock, MemoryLock>();
            }
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

            app.UseOpenApi(settings =>
            {
                settings.PostProcess = (document, request) =>
                {
                    if (!request.Headers.TryGetValue("X-Scheme", out var scheme) || !Enum.TryParse(scheme, true, out OpenApiSchema openApiSchema)) return;
                    document.Schemes.Clear();
                    document.Schemes.Add(openApiSchema);
                };
            });
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