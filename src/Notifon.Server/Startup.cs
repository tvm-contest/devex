using System;
using System.IO;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using Notifon.Server.Configuration;
using Notifon.Server.Database;
using Notifon.Server.MassTransit;
using Notifon.Server.Redis;
using Notifon.Server.SignalR;
using NSwag;
using Prometheus;
using Serilog;
using AppOptions = Notifon.Server.Configuration.Options.AppOptions;

namespace Notifon.Server {
    public class Startup {
        public Startup(IConfiguration configuration) {
            Configuration = configuration;
        }

        public IConfiguration Configuration { get; }

        // This method gets called by the runtime. Use this method to add services to the container.
        // For more information on how to configure your application, visit https://go.microsoft.com/fwlink/?LinkID=398940
        public void ConfigureServices(IServiceCollection services) {
            // configure asp net
            services.AddControllersWithViews(options => {
                options.InputFormatters.Insert(options.InputFormatters.Count, new TextPlainInputFormatter());
            });
            services.AddRazorPages();
            services.AddSwaggerDocument(settings => { settings.Title = Configuration.GetSection("App").Get<AppOptions>().Name; });
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
            services.AddCors(o => o.AddPolicy("SubmitClient", builder => builder.AllowAnyOrigin()));

            // add configuration options
            services.ConfigureOptions(Configuration);

            //Menu helper
            services.AddSingleton<MenuHelper>();

            // http client for sending http hooks
            services.AddHttpClient();

            //Firebase messaging
            services.AddSingleton(FirebaseMessaging.GetMessaging(FirebaseApp.Create(new FirebaseAdmin.AppOptions {
                Credential = GoogleCredential.FromFile(Path.Combine(Directory.GetCurrentDirectory(), "firebase-key.json"))
            })));

            // add masstransit with rabbit if configured else use in-memory bus
            services.AddMassTransit(Configuration.ContainsRabbitMqOptions());

            // setup PostgreSql database if connections string is defined else SQLLite 
            services.AddDatabase(Configuration.GetPostgreSqlConnectionString());

            // setup redis distributed lock and cache if redis options defined else in-memory
            services.AddDistributedLockAndCache(Configuration.ContainsRedisOptions());

            // signalr hub
            services.AddSignalR();
            services.AddSingleton<IUserIdProvider, ByHashUserIdProvider>();

            // add free ton client 
            services.AddTonClient();
        }

        // This method gets called by the runtime. Use this method to configure the HTTP request pipeline.
        public void Configure(IApplicationBuilder app, IWebHostEnvironment env) {
            if (env.IsDevelopment()) {
                app.UseDeveloperExceptionPage();
                app.UseWebAssemblyDebugging();
            }
            else {
                app.UseExceptionHandler("/Error");
            }

            app.UseSerilogRequestLogging();

            app.UseOpenApi(settings => {
                settings.PostProcess = (document, request) => {
                    if (!request.Headers.TryGetValue("X-Scheme", out var scheme) ||
                        !Enum.TryParse(scheme, true, out OpenApiSchema openApiSchema)) return;
                    document.Schemes.Clear();
                    document.Schemes.Add(openApiSchema);
                };
            });
            app.UseSwaggerUi3();

            app.UseBlazorFrameworkFiles();
            app.UseStaticFiles();

            app.UseRouting()
                .UseCors()
                .UseEndpoints(endpoints => {
                    endpoints.MapRazorPages();
                    endpoints.MapControllers();
                    endpoints.MapHub<SignalRHub>("/signalr");
                    endpoints.MapFallbackToFile("index.html");
                    endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions {
                        Predicate = check => check.Tags.Contains("ready")
                    });
                    endpoints.MapHealthChecks("/health/live", new HealthCheckOptions());
                    endpoints.MapMetrics();
                });
        }
    }
}