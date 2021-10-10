using System;
using System.Net.Http;
using System.Threading.Tasks;

namespace Notifon.Client {
    public class AppInfoProvider {
        private readonly Lazy<Task<AppOptions>> _appOptionsLazy;

        public AppInfoProvider(HttpClient httpClient) {
            var appInfoClient = new ApiAppInfoClient(httpClient);
            var taskFunc = new Func<Task<AppOptions>>(() => appInfoClient.GetServerStatusAsync());
            _appOptionsLazy = new Lazy<Task<AppOptions>>(taskFunc);
        }

        public async Task<AppOptions> GetAppOptions() {
            return await _appOptionsLazy.Value;
        }
    }
}