using System;
using Common;
using Microsoft.AspNetCore.Builder;
using Microsoft.AspNetCore.Diagnostics.HealthChecks;
using Microsoft.AspNetCore.Hosting;
using Microsoft.AspNetCore.Routing;
using Microsoft.AspNetCore.SignalR;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Hosting;
using NSwag;
using Prometheus;
using Serilog;

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
            // configure asp net
            services.AddControllersWithViews(options => { options.InputFormatters.Insert(options.InputFormatters.Count, new TextPlainInputFormatter()); });
            services.AddRazorPages();
            services.AddSwaggerDocument(settings => { settings.Title = ProjectConstants.ServiceName; });
            services.Configure<RouteOptions>(options => options.LowercaseUrls = true);
            services.AddCors(o => o.AddPolicy("SubmitClient", builder => builder.AllowAnyOrigin()));

            // add configuration options
            services.ConfigureOptions(Configuration);

            // http client for sending http hooks
            services.AddHttpClient();

            // add masstransit with rabbit if configured else use in-memory bus
            services.AddMassTransit(Configuration.ContainsRabbitMqOptions());

            // setup PostgreSql database if connections string is defined else SQLLite 
            services.AddDatabase(Configuration.GetPostgreSqlConnectionString());

            // setup redis distributed lock and cache if redis options defined else in-memory
            services.AddDistributedLockAndCache(Configuration.ContainsRedisOptions());

            // signalr hub
            services.AddSignalR();
            services.AddSingleton<IUserIdProvider, ByHashUserIdProvider>();

            // messages decrypting
            services.AddTonClient();
            services.AddTransient<IMessageDecryptor, MessageDecryptor>();
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
                    endpoints.MapHub<SignalRHub>("/signalr");
                    endpoints.MapFallbackToFile("index.html");
                    endpoints.MapHealthChecks("/health");
                    endpoints.MapHealthChecks("/health/ready", new HealthCheckOptions
                    {
                        Predicate = check => check.Tags.Contains("ready")
                    });
                    endpoints.MapMetrics();
                });
        }
    }
}