using System;
using System.Linq;
using System.Net.Http;
using FirebaseAdmin.Messaging;
using GreenPipes;
using MassTransit;
using MassTransit.ConsumeConfigurators;
using MassTransit.Definition;
using Microsoft.Extensions.Options;
using Notifon.Server.Business.Exceptions;
using Notifon.Server.Configuration.Options;

namespace Notifon.Server.Business.Events {
    public abstract class PublishMessageConsumerDefinitionBase<T> : ConsumerDefinition<T> where T : class, IConsumer {
        private readonly int _retryCount;
        private readonly TimeSpan _retryInterval;
        private readonly int[] _retryStatusCodes = { 425, 429 };

        protected PublishMessageConsumerDefinitionBase(IOptions<RetryPolicyOptions> retryPolicyOptionsAccessor) {
            _retryCount = retryPolicyOptionsAccessor.Value.Count;
            _retryInterval = retryPolicyOptionsAccessor.Value.Interval;
        }

        protected override void ConfigureConsumer(IReceiveEndpointConfigurator endpointConfigurator,
            IConsumerConfigurator<T> e) {
            if (_retryCount > 0)
                e.UseDelayedRedelivery(configurator => {
                    configurator.Ignore<WrongEndpointFormatException>();
                    configurator.Ignore<NoRequiredParametersException>();
                    configurator.Ignore<NoFirebaseMessagingException>();
                    configurator.Ignore<FirebaseMessagingException>(
                        exception => exception.Message.Equals("Requested entity was not found."));
                    configurator.Ignore<HttpRequestException>(exception => exception.StatusCode != null
                                                                           && !_retryStatusCodes.Contains((int)exception.StatusCode)
                                                                           && (int)exception.StatusCode is >= 400 and <= 499);
                    configurator.Interval(_retryCount, _retryInterval);
                });

            base.ConfigureConsumer(endpointConfigurator, e);
        }
    }
}