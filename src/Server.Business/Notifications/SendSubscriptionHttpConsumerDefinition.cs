using System;
using GreenPipes;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;

namespace Server.Notifications
{
    public class SendSubscriptionHttpConsumerDefinition : ConsumerDefinition<SendSubscriptionHttpConsumer>
    {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendSubscriptionHttpConsumer> e)
        {
            e.UseDelayedRedelivery(configurator => configurator.Interval(144, TimeSpan.FromMinutes(10)));
        }
    }
}