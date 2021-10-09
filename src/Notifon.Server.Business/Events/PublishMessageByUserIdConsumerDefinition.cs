using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;

namespace Notifon.Server.Business.Events {
    public class PublishMessageByUserIdConsumerDefinition : ConsumerDefinition<PublishMessageByUserIdConsumer> {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<PublishMessageByUserIdConsumer> consumerConfigurator) { }
    }
}