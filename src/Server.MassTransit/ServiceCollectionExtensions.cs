using MassTransit;
using MassTransit.PrometheusIntegration;
using MassTransit.RabbitMqTransport;
using MassTransit.Registration;
using MassTransit.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Server.Notifications;
using Server.Options;
using Server.Requests.Api;
using Server.Requests.Endpoint;
using Server.Requests.TonClient;

namespace Server
{
    public static class ServiceCollectionExtensions
    {
        public static IServiceCollection AddMassTransit(this IServiceCollection services, bool useRabbitMq)
        {
            services
                .AddMediator(x =>
                {
                    x.AddConsumer<GetServerStatusConsumer>();
                    x.AddRequestClient<GetServerStatus>();
                    x.AddConsumer<SubmitClientConsumer>();
                    x.AddRequestClient<SubmitClient>();
                    x.AddConsumer<DecryptEncryptedMessageConsumer>();
                    x.AddRequestClient<DecryptEncryptedMessage>();
                })
                .AddMassTransit(x =>
                {
                    x.AddDelayedMessageScheduler();
                    x.AddConsumer<SendSubscriptionHttpConsumer, SendSubscriptionHttpConsumerDefinition>();
                    x.AddConsumer<SendSubscriptionTelegramConsumer, SendSubscriptionTelegramConsumerDefinition>();
                    x.AddConsumer<SendSubscriptionMailgunConsumer, SendSubscriptionMailgunConsumerDefinition>();
                    x.AddRider(RiderRegistrationConfiguratorExtensions.UsingKafka);
                    x.AddSignalRHub<SignalRHub>();
                    x.SetKebabCaseEndpointNameFormatter();

                    if (useRabbitMq)
                        x.UsingRabbitMq((context, cfg) =>
                        {
                            SetupRabbitMqHost(cfg, context);
                            ConfigureContext(cfg, context);
                            cfg.ConfigureEndpoints(context);
                        });
                    else
                        x.UsingInMemory((context, cfg) =>
                        {
                            ConfigureContext(cfg, context);
                            cfg.ConfigureEndpoints(context);
                        });
                })
                .AddMassTransitHostedService();

            return services;
        }

        private static void ConfigureContext(IBusFactoryConfigurator cfg, IConfigurationServiceProvider context)
        {
            cfg.UseDelayedMessageScheduler();
            cfg.UsePublishFilter(typeof(SendSubscriptionAddClientInfoHeaderFilter<>), context);
            cfg.UsePublishFilter(typeof(SendSubscriptionDecryptMessageFilter<>), context);
            cfg.UsePrometheusMetrics();
        }

        private static void SetupRabbitMqHost(IRabbitMqBusFactoryConfigurator cfg, IConfigurationServiceProvider context)
        {
            var options = context.GetRequiredService<IOptions<RabbitMqOptions>>().Value;
            cfg.Host(options.Host, r =>
            {
                r.Username(options.Username);
                r.Password(options.Password);
            });
        }
    }
}