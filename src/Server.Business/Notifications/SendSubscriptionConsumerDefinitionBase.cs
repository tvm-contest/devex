using System;
using System.Net;
using System.Net.Http;
using GreenPipes;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Microsoft.Extensions.Options;
using Server.Options;

namespace Server.Notifications {
    public abstract class SendSubscriptionConsumerDefinitionBase<T> : ConsumerDefinition<T> where T : class, IConsumer {
        private readonly int _retryCount;
        private readonly TimeSpan _retryInterval;

        protected SendSubscriptionConsumerDefinitionBase(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) {
            _retryCount = retryPolicyOptionsAccessor.Value.Count;
            _retryInterval = retryPolicyOptionsAccessor.Value.Interval;
        }

        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<T> e) {
            if (_retryCount > 0)
                e.UseDelayedRedelivery(configurator => {
                    configurator.Ignore<HttpRequestException>(exception =>
                        exception.StatusCode >= (HttpStatusCode?)400 && exception.StatusCode <= (HttpStatusCode?)499);
                    configurator.Interval(_retryCount, _retryInterval);
                });

            base.ConfigureConsumer(endpointConfigurator, e);
        }
    }
}