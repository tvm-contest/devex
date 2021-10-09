using System;
using System.Threading.Tasks;
using MassTransit;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Notifon.Server.Business.Events;
using Notifon.Server.Business.Models;

namespace Notifon.Server.Kafka {
    // ReSharper disable once ClassNeverInstantiated.Global
    public class KafkaMessageConsumer : IConsumer<KafkaMessage> {
        private readonly IDistributedCache _distributedCache;
        private readonly IDistributedLock _lock;
        private readonly ILogger<KafkaMessageConsumer> _logger;

        public KafkaMessageConsumer(ILogger<KafkaMessageConsumer> logger, IDistributedCache distributedCache, IDistributedLock @lock) {
            _logger = logger;
            _distributedCache = distributedCache;
            _lock = @lock;
        }

        public async Task Consume(ConsumeContext<KafkaMessage> context) {
            var message = context.Message;
            var cacheKey = $"KafkaMessageKey:{context.GetKey<string>()}";
            var lockKey = $"KafkaMessageLock:{context.GetKey<string>()}";
            var cancellationToken = context.CancellationToken;

            // avoid consuming similar message 
            using var @lock = await _lock.CreateLockAsync(lockKey, cancellationToken: cancellationToken);

            // check that this key wasn't consumed before
            var cache = await _distributedCache.GetAsync(cacheKey, cancellationToken);

            //skip if already consumed
            if (cache != null) {
                _logger.LogTrace("Skipping already consumed message {Key}", cacheKey);
                return;
            }

            _logger.LogTrace("Received message with Key:{Key}", cacheKey);

            await context.Publish<PublishMessageByUserId>(
                new {
                    UserId = message.Hash,
                    Message = new EncryptedMessage(message.Nonce, message.EncodedMessage)
                }, cancellationToken);

            // mark as consumed
            await _distributedCache.SetAsync(cacheKey, new byte[1],
                new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromDays(2) },
                cancellationToken);
        }
    }
}