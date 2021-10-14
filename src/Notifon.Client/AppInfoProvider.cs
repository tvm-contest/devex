using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;

namespace Notifon.Client {
    public class AppInfoProvider {
        private readonly Lazy<Task<AppOptions>> _appOptionsLazy;

        public AppInfoProvider(HttpClient httpClient, ILocalStorageService localStorageService) {
            _appOptionsLazy = new Lazy<Task<AppOptions>>(async () => {
                var appInfoClient = new ApiAppInfoClient(httpClient);
                try {
                    var options = await appInfoClient.GetServerStatusAsync();
                    await localStorageService.SetItemAsync("AppOptions", options);
                    return options;
                }
                catch (HttpRequestException) {
                    var appOptions = await localStorageService.GetItemAsync<AppOptions>("AppOptions");
                    return appOptions ?? new AppOptions();
                }
            });
        }

        public async Task<AppOptions> GetAppOptions() {
            return await _appOptionsLazy.Value;
        }
    }
}