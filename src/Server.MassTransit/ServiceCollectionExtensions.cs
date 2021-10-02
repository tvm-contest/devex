using MassTransit;
using MassTransit.RabbitMqTransport;
using MassTransit.Registration;
using MassTransit.SignalR;
using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Options;
using Server.Options;
using Server.Requests;

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
                })
                .AddMassTransit(x =>
                {
                    x.AddConsumer<SendSubscriptionHttpConsumer>();
                    x.AddRider(RiderRegistrationConfiguratorExtensions.UsingKafka);
                    x.AddSignalRHub<SignalRHub>();
                    x.SetKebabCaseEndpointNameFormatter();

                    if (useRabbitMq)
                        x.UsingRabbitMq((context, cfg) =>
                        {
                            cfg.UsePublishFilter(typeof(SendSubscriptionAddClientInfoFilter<>), context);

                            SetupRabbitMqHost(cfg, context);

                            cfg.ConfigureEndpoints(context);
                        });
                    else
                        x.UsingInMemory((context, cfg) => cfg.ConfigureEndpoints(context));
                })
                .AddMassTransitHostedService();

            return services;
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