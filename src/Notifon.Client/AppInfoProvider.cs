using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;

namespace Notifon.Client {
    public class AppConfigProvider {
        private const string StorageKey = "AppConfig";
        private readonly Lazy<Task<AppConfig>> _appConfigLazy;

        public AppConfigProvider(HttpClient httpClient, ILocalStorageService localStorageService) {
            _appConfigLazy = new Lazy<Task<AppConfig>>(async () => {
                var appInfoClient = new ApiAppClient(httpClient);

                try {
                    var config = await appInfoClient.GetConfigAsync();
                    await localStorageService.SetItemAsync(StorageKey, config);
                    return config;
                }
                catch (HttpRequestException) {
                    var appOptions = await localStorageService.GetItemAsync<AppConfig>(StorageKey);
                    return appOptions ?? new AppConfig();
                }
            });
        }

        public async Task<AppConfig> GetAppOptions() {
            return await _appConfigLazy.Value;
        }
    }
}