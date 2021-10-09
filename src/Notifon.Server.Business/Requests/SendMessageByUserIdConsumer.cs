using System.Linq;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.EntityFrameworkCore;
using Microsoft.Extensions.Logging;
using Notifon.Server.Database;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Requests {
    public class SendMessageByUserIdConsumer : IConsumer<SendMessageByUserId> {
        private readonly ServerDbContext _db;
        private readonly ILogger<SendMessageByUserIdConsumer> _logger;

        public SendMessageByUserIdConsumer(ServerDbContext db, ILogger<SendMessageByUserIdConsumer> logger) {
            _db = db;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<SendMessageByUserId> context) {
            var cancellationToken = context.CancellationToken;
            var userId = context.Message.UserId;
            var user = await _db.Users
                .Include(u => u.Endpoints)
                .SingleOrDefaultAsync(u => u.Id == userId, cancellationToken);

            if (user == null) {
                _logger.LogWarning("Processing message for user who was not found in DB");
                return;
            }

            var message = context.Message.Message;
            var tasks = user
                .Endpoints
                .Select(endpoint =>
                    context.Publish<PublishMessage>(new {
                        endpoint.Endpoint,
                        endpoint.EndpointType,
                        endpoint.Parameters,
                        Message = message,
                        user.SecretKey
                    }, cancellationToken));

            await Task.WhenAll(tasks);
        }
    }
}