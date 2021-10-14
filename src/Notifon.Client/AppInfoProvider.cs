using System;
using System.Net.Http;
using System.Threading.Tasks;
using Blazored.LocalStorage;

namespace Notifon.Client {
    public class AppOptionsProvider {
        private const string StorageKey = "AppOptions";
        private readonly Lazy<Task<AppOptions>> _appOptionsLazy;

        public AppOptionsProvider(HttpClient httpClient, ILocalStorageService localStorageService) {
            _appOptionsLazy = new Lazy<Task<AppOptions>>(async () => {
                var appInfoClient = new ApiAppClient(httpClient);

                try {
                    var options = await appInfoClient.GetOptionsAsync();
                    await localStorageService.SetItemAsync(StorageKey, options);
                    return options;
                }
                catch (HttpRequestException) {
                    var appOptions = await localStorageService.GetItemAsync<AppOptions>(StorageKey);
                    return appOptions ?? new AppOptions();
                }
            });
        }

        public async Task<AppOptions> GetAppOptions() {
            return await _appOptionsLazy.Value;
        }
    }
}