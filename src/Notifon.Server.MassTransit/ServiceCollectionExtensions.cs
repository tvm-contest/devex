using MassTransit;
using MassTransit.PrometheusIntegration;
using MassTransit.RabbitMqTransport;
using MassTransit.Registration;
using MassTransit.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Notifications;
using Notifon.Server.Business.Requests.Api;
using Notifon.Server.Business.Requests.Endpoint;
using Notifon.Server.Business.Requests.TonClient;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Kafka;
using Notifon.Server.SignalR;

namespace Notifon.Server.MassTransit {
    public static class ServiceCollectionExtensions {
        public static IServiceCollection AddMassTransit(this IServiceCollection services, bool useRabbitMq) {
            services
                .AddMediator(x => {
                    x.AddConsumer<GetServerStatusConsumer>();
                    x.AddRequestClient<GetServerStatus>();
                    x.AddConsumer<SubmitClientConsumer>();
                    x.AddRequestClient<SubmitClient>();
                    x.AddConsumer<DecryptEncryptedMessageConsumer>();
                    x.AddRequestClient<DecryptEncryptedMessage>();
                })
                .AddMassTransit(x => {
                    x.AddDelayedMessageScheduler();
                    x.AddConsumer<SendSubscriptionHttpConsumer, SendSubscriptionHttpConsumerDefinition>();
                    x.AddConsumer<SendSubscriptionTelegramConsumer, SendSubscriptionTelegramConsumerDefinition>();
                    x.AddConsumer<SendSubscriptionMailgunConsumer, SendSubscriptionMailgunConsumerDefinition>();
                    x.AddRider(RiderRegistrationConfiguratorExtensions.KafkaRegistrationConfigurator);
                    x.AddSignalRHub<SignalRHub>();
                    x.SetKebabCaseEndpointNameFormatter();

                    if (useRabbitMq)
                        x.UsingRabbitMq((context, cfg) => {
                            SetupRabbitMqHost(cfg, context);
                            ConfigureContext(cfg, context);
                            cfg.ConfigureEndpoints(context);
                        });
                    else
                        x.UsingInMemory((context, cfg) => {
                            ConfigureContext(cfg, context);
                            cfg.ConfigureEndpoints(context);
                        });
                })
                .AddMassTransitHostedService();

            return services;
        }

        private static void ConfigureContext(IBusFactoryConfigurator cfg, IConfigurationServiceProvider context) {
            cfg.UseDelayedMessageScheduler();
            cfg.UsePublishFilter(typeof(SendSubscriptionAddClientInfoHeaderFilter<>), context);
            cfg.UsePublishFilter(typeof(SendSubscriptionDecryptMessageFilter<>), context);
            cfg.UsePrometheusMetrics();
        }

        private static void SetupRabbitMqHost(IRabbitMqBusFactoryConfigurator cfg,
            IConfigurationServiceProvider context) {
            var options = context.GetRequiredService<IOptions<RabbitMqOptions>>().Value;
            cfg.Host(options.Host, r => {
                r.Username(options.Username);
                r.Password(options.Password);
            });
        }
    }
}