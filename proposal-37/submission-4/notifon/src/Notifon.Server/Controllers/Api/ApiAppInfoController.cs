using System.IO;
using System.Text.Json;
using System.Threading;
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
        private static readonly string FirebaseConfigFile = Path.Combine(Directory.GetCurrentDirectory(), "firebase-config.json");
        private readonly IOptions<AppOptions> _appOptionsAccessor;

        public ApiAppController(IOptions<AppOptions> appOptionsAccessor) {
            _appOptionsAccessor = appOptionsAccessor;
        }

        [HttpGet("options")]
        public Task<AppOptions> GetAppOptions() {
            return Task.FromResult(_appOptionsAccessor.Value);
        }

        [HttpGet("firebase-config")]
        public async Task<JsonResult> GetFirebaseConfig(CancellationToken cancellationToken) {
            JsonElement? firebaseConfig = null;
            if (System.IO.File.Exists(FirebaseConfigFile)) {
                await using var fileStream = System.IO.File.OpenRead(FirebaseConfigFile);
                var doc = await JsonDocument.ParseAsync(fileStream, cancellationToken: cancellationToken);
                firebaseConfig = doc.RootElement;
            }

            return new JsonResult(firebaseConfig);
        }
    }
}