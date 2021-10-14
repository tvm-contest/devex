using System.Threading.Tasks;
using Microsoft.AspNetCore.Mvc;
using Microsoft.Extensions.Options;
using Notifon.Server.Configuration.Options;
using NSwag.Annotations;

namespace Notifon.Server.Controllers.Api {
    [ApiController]
    [OpenApiTag("API")]
    [Route("api/app")]
    public class ApiAppController : ControllerBase {
        private readonly IOptions<AppOptions> _appOptionsAccessor;

        public ApiAppController(IOptions<AppOptions> appOptionsAccessor) {
            _appOptionsAccessor = appOptionsAccessor;
        }

        [HttpGet("options")]
        public async Task<AppOptions> GetOptions() {
            var appOptions = await Task.FromResult(_appOptionsAccessor.Value);

            return appOptions;
        }
    }
}