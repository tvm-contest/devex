using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection;
using MudBlazor.Services;
using Notifon.Client.Storage;

namespace Notifon.Client {
    public class Program {
        public static async Task Main(string[] args) {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);
            builder.RootComponents.Add<App>("#app");

            builder.Services
                .AddMudServices();

            builder.Services
                .AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) })
                .AddTransient<IApiClient, ApiClient>();

            builder.Services
                .AddBlazoredLocalStorage()
                .AddScoped<IMessageInfoStorage, MessageInfoStorage>();

            await builder.Build().RunAsync();
        }
    }
}