using System.Threading.Tasks;
using MassTransit;
using MassTransit.Mediator;
using Microsoft.Extensions.Logging;
using Server.Business;

namespace Server.Kafka
{
    // ReSharper disable once ClassNeverInstantiated.Global
    public class KafkaMessageConsumer : IConsumer<KafkaMessage>
    {
        private readonly ILogger<KafkaMessageConsumer> _logger;
        private readonly IMediator _mediator;

        public KafkaMessageConsumer(ILogger<KafkaMessageConsumer> logger, IMediator mediator)
        {
            _logger = logger;
            _mediator = mediator;
        }

        public async Task Consume(ConsumeContext<KafkaMessage> context)
        {
            var message = context.Message;
            var cancellationToken = context.CancellationToken;

            _logger.LogTrace("Received message {@Message}", message);

            await _mediator.Send<SendSubscription>(new { message.Hash, message.Nonce, message.EncodedMessage }, cancellationToken);
        }
    }
}