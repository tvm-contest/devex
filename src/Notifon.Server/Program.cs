using System.IO;
using FirebaseAdmin;
using FirebaseAdmin.Messaging;
using Google.Apis.Auth.OAuth2;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Serilog;
using Serilog.Events;

namespace Notifon.Server {
    public static class Program {
        public static void Main(string[] args) {
            DotEnv.Load();
            Log.Logger = new LoggerConfiguration()
                .MinimumLevel.Override("Microsoft", LogEventLevel.Information)
                .Enrich.FromLogContext()
                .WriteTo.Console()
                .CreateBootstrapLogger();

            InitFirebaseApp();

            CreateHostBuilder(args)
                .UseSerilog((context, configuration) => configuration.ReadFrom.Configuration(context.Configuration))
                .Build()
                .ApplyDatabaseMigrations()
                .Run();
        }

        public static IHostBuilder CreateHostBuilder(string[] args) {
            return Host.CreateDefaultBuilder(args)
                .ConfigureWebHostDefaults(webBuilder => {
                    webBuilder.UseStartup<Startup>();
                    webBuilder.UseSentry();
                });
        }

        private static void InitFirebaseApp() {
            if (FirebaseMessaging.DefaultInstance == null)
                FirebaseApp.Create(new AppOptions {
                    Credential = GoogleCredential.FromFile(Path.Combine(Directory.GetCurrentDirectory(), "firebase-key.json"))
                });
        }
    }
}