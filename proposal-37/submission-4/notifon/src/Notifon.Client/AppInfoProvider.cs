using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;

namespace Notifon.Client {
    public class AppConfigProvider {
        private const string StorageKey = "AppOptions";
        private readonly Lazy<Task<AppOptions>> _appConfigLazy;

        public AppConfigProvider(HttpClient httpClient, ILocalStorageService localStorageService) {
            _appConfigLazy = new Lazy<Task<AppOptions>>(async () => {
                var appInfoClient = new ApiAppClient(httpClient);

                try {
                    var config = await appInfoClient.GetAppOptionsAsync();
                    await localStorageService.SetItemAsync(StorageKey, config);
                    return config;
                }
                catch (HttpRequestException) {
                    var appOptions = await localStorageService.GetItemAsync<AppOptions>(StorageKey);
                    return appOptions ?? new AppOptions();
                }
            });
        }

        public async Task<AppOptions> GetAppOptions() {
            return await _appConfigLazy.Value;
        }
    }
}