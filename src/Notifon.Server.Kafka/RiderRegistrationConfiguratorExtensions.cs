using System.Net;
using System.Text;
using Confluent.Kafka;
using MassTransit;
using MassTransit.Registration;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Options;
using Notifon.Server.Configuration.Options;

namespace Notifon.Server.Kafka {
    public static class RiderRegistrationConfiguratorExtensions {
        public static void KafkaRegistrationConfigurator(this IRiderRegistrationConfigurator x) {
            x.AddConsumer<KafkaMessageConsumer>();
            x.AddDelayedMessageScheduler();
            x.UsingKafka((context, kafkaConfigurator) => {
                var kafkaOptions = context.GetRequiredService<IOptions<KafkaOptions>>().Value;
                kafkaConfigurator.SecurityProtocol = SecurityProtocol.SaslPlaintext;
                kafkaConfigurator.Host(kafkaOptions.Host, hostConfigurator =>
                    hostConfigurator.UseSasl(saslConfigurator => {
                        saslConfigurator.Mechanism = SaslMechanism.ScramSha512;
                        saslConfigurator.Username = kafkaOptions.UserName;
                        saslConfigurator.Password = kafkaOptions.Password;
                    }));

                var groupId = ComposeGroupId(context);

                kafkaConfigurator.TopicEndpoint<string, KafkaMessage>(kafkaOptions.Topic, groupId,
                    e => {
                        e.AutoOffsetReset = AutoOffsetReset.Earliest;
                        e.SetValueDeserializer(new KafkaMessageDeserializer());
                        e.ConfigureConsumer<KafkaMessageConsumer>(context);
                    });
            });
        }

        private static string ComposeGroupId(IConfigurationServiceProvider context) {
            var hostEnv = context.GetRequiredService<IHostEnvironment>();
            var groupIdBuilder = new StringBuilder(hostEnv.EnvironmentName);
            if (hostEnv.IsDevelopment()) //use different group-id for different developers
                groupIdBuilder.AppendFormat("-{0}", Dns.GetHostName());
            return groupIdBuilder.ToString();
        }
    }
}