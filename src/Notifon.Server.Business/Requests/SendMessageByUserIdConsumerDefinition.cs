using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;

namespace Notifon.Server.Business.Requests {
    public class SendMessageByUserIdConsumerDefinition : ConsumerDefinition<SendMessageByUserIdConsumer> {
        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<SendMessageByUserIdConsumer> consumerConfigurator) { }
    }
}