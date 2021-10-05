using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;

namespace Server.Notifications
{
    public class SendSubscriptionTelegramConsumerDefinition : ConsumerDefinition<SendSubscriptionTelegramConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendSubscriptionTelegramConsumer> e)
        {
            e.UseDelayedRedelivery(HttpRetryPolicy.ConfigureHttpRetry);
        }
    }
}