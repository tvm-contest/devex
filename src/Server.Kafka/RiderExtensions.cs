using Confluent.Kafka;
using MassTransit;
using MassTransit.Registration;
using Microsoft.Extensions.Options;

namespace Server.Kafka
{
    public static class RiderRegistrationConfiguratorExtensions
    {
        public static void UsingKafka(this IRiderRegistrationConfigurator configurator)
        {
            configurator.AddConsumer<KafkaMessageConsumer>();
            configurator.UsingKafka((context, factoryConfigurator) =>
            {
                var kafkaOptions = context.GetRequiredService<IOptions<KafkaOptions>>().Value;
                factoryConfigurator.SecurityProtocol = SecurityProtocol.SaslPlaintext;
                factoryConfigurator.Host(kafkaOptions.Host, hostConfigurator =>
                    hostConfigurator.UseSasl(saslConfigurator =>
                    {
                        saslConfigurator.Mechanism = SaslMechanism.ScramSha512;
                        saslConfigurator.Username = kafkaOptions.UserName;
                        saslConfigurator.Password = kafkaOptions.Password;
                    }));

                factoryConfigurator.TopicEndpoint<KafkaMessage>(kafkaOptions.Topic, "consumer-group-name",
                    e =>
                    {
                        e.AutoOffsetReset = AutoOffsetReset.Earliest;
                        e.SetValueDeserializer(new KafkaMessageDeserializer());
                        e.ConfigureConsumer<KafkaMessageConsumer>(context);
                    });
            });
        }
    }
}