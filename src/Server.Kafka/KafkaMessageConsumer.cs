using System;
using System.Threading.Tasks;
using MassTransit;
using MassTransit.Mediator;
using Microsoft.Extensions.Caching.Distributed;
using Microsoft.Extensions.Logging;
using Server.Business.Requests;

namespace Server.Kafka
{
    // ReSharper disable once ClassNeverInstantiated.Global
    public class KafkaMessageConsumer : IConsumer<KafkaMessage>
    {
        private readonly IDistributedCache _distributedCache;
        private readonly IDistributedLock _lock;
        private readonly ILogger<KafkaMessageConsumer> _logger;
        private readonly IMediator _mediator;

        public KafkaMessageConsumer(ILogger<KafkaMessageConsumer> logger, IMediator mediator, IDistributedCache distributedCache, IDistributedLock @lock)
        {
            _logger = logger;
            _mediator = mediator;
            _distributedCache = distributedCache;
            _lock = @lock;
        }

        public async Task Consume(ConsumeContext<KafkaMessage> context)
        {
            var key = context.GetKey<string>();
            var message = context.Message;
            var cancellationToken = context.CancellationToken;

            // lock consuming for this key
            using var @lock = await _lock.CreateLockAsync(key, cancellationToken: cancellationToken);
            // check that this key wasn't consumed before
            var cache = await _distributedCache.GetAsync(key, cancellationToken);
            //skip if already consumed
            if (cache != null)
            {
                _logger.LogTrace("Skipping already consumed message {Key}", key);
                return;
            }

            _logger.LogTrace("Received message Key:{Key}", key, message);
            // send message to subscriber
            await _mediator.Send<SendSubscription>(new { message.Hash, message.Nonce, message.EncodedMessage }, cancellationToken);
            // mark as consumed
            await _distributedCache.SetAsync(key, new byte[1], new DistributedCacheEntryOptions { SlidingExpiration = TimeSpan.FromHours(25) },
                cancellationToken);
        }
    }
}