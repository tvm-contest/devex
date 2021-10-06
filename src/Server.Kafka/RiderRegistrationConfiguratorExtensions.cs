using System;
using System.Net;
using Confluent.Kafka;
using GreenPipes;
using MassTransit;
using MassTransit.Registration;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;
using Server.KafkaMessage;
using Server.Options;

namespace Server {
    public static class RiderRegistrationConfiguratorExtensions {
        public static void UsingKafka(this IRiderRegistrationConfigurator configurator) {
            configurator.AddConsumer<KafkaMessageConsumer>();
            configurator.UsingKafka((context, factoryConfigurator) => {
                var kafkaOptions = context.GetRequiredService<IOptions<KafkaOptions>>().Value;
                factoryConfigurator.SecurityProtocol = SecurityProtocol.SaslPlaintext;
                factoryConfigurator.Host(kafkaOptions.Host, hostConfigurator =>
                    hostConfigurator.UseSasl(saslConfigurator => {
                        saslConfigurator.Mechanism = SaslMechanism.ScramSha512;
                        saslConfigurator.Username = kafkaOptions.UserName;
                        saslConfigurator.Password = kafkaOptions.Password;
                    }));


#if DEBUG
                var groupId = $"local-{Dns.GetHostName()}";
#else
                const string groupId = "server-group-1";
#endif

                factoryConfigurator.TopicEndpoint<string, KafkaMessage.KafkaMessage>(kafkaOptions.Topic, groupId,
                    e => {
                        e.AutoOffsetReset = AutoOffsetReset.Earliest;
                        e.SetValueDeserializer(new KafkaMessageDeserializer());
                        e.ConfigureConsumer<KafkaMessageConsumer>(context);
                        e.SetOffsetsCommittedHandler(OffsetsCommittedHandler(context));
                        e.UseScheduledRedelivery(c =>
                            c.Incremental(144, TimeSpan.FromMinutes(5), TimeSpan.FromMinutes(10)));
                        e.UseMessageRetry(c => c.Immediate(3));
                    });
            });
        }

        private static Action<IConsumer<string, KafkaMessage.KafkaMessage>, CommittedOffsets> OffsetsCommittedHandler(
            IConfigurationServiceProvider context) {
            return (_, offsets) => {
                var logger = context.GetRequiredService<ILoggerFactory>().CreateLogger("SetOffsetsCommittedHandler");
                logger.LogInformation("Offsets.Count: {Count}", offsets.Offsets.Count);
            };
        }
    }
}