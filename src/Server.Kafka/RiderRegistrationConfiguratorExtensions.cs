using System;
using Confluent.Kafka;
using GreenPipes;
using MassTransit;
using MassTransit.Registration;
using Microsoft.Extensions.Logging;
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

                factoryConfigurator.TopicEndpoint<string, KafkaMessage>(kafkaOptions.Topic, "group-1",
                    e =>
                    {
                        e.UseScheduledRedelivery(c => c.Incremental(5, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(5)));
                        e.UseMessageRetry(c => c.Immediate(3));
                        e.AutoOffsetReset = AutoOffsetReset.Latest;
                        e.SetOffsetsCommittedHandler(OffsetsCommittedHandler(context));
                        e.SetValueDeserializer(new KafkaMessageDeserializer());
                        e.ConfigureConsumer<KafkaMessageConsumer>(context);
                    });
            });
        }

        private static Action<IConsumer<string, KafkaMessage>, CommittedOffsets> OffsetsCommittedHandler(IConfigurationServiceProvider context)
        {
            return (_, offsets) =>
            {
                var logger = context.GetRequiredService<ILoggerFactory>().CreateLogger("SetOffsetsCommittedHandler");
                logger.LogInformation("Offsets.Count: {Count}", offsets.Offsets.Count);
            };
        }
    }
}