using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;
using Client.Storage;
using Microsoft.AspNetCore.Components.WebAssembly.Hosting;
using Microsoft.Extensions.DependencyInjection;

namespace Client
{
    public class Program
    {
        public static async Task Main(string[] args)
        {
            var builder = WebAssemblyHostBuilder.CreateDefault(args);
            builder.RootComponents.Add<App>("#app");

            builder.Services
                .AddScoped(sp => new HttpClient { BaseAddress = new Uri(builder.HostEnvironment.BaseAddress) })
                .AddTransient<IApiClient, ApiClient>()
                .AddTransient<IMessageInfoStorage, MessageInfoStorage>()
                .AddBlazoredLocalStorage();

            await builder.Build().RunAsync();
        }
    }
}