using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Notifon.Server.Configuration.Options;
using NSwag.Annotations;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [OpenApiTag("API")]
    [Route("api/app-info")]
    public class ApiAppInfoController : ControllerBase {
        private readonly IOptions<AppOptions> _appOptionsAccessor;

        public ApiAppInfoController(IOptions<AppOptions> appOptionsAccessor) {
            _appOptionsAccessor = appOptionsAccessor;
        }

        [HttpGet]
        public async Task<AppOptions> GetServerStatus() {
            var appOptions = await Task.FromResult(_appOptionsAccessor.Value);

            return appOptions;
        }
    }
}