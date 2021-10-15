using System.Threading.Tasks;
using GreenPipes;
using MassTransit;
using Microsoft.Extensions.Logging;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Events {
    public class PublishMessageLoggingFilter<T> : IFilter<PublishContext<T>> where T : class {
        private readonly ILogger<PublishMessageLoggingFilter<T>> _logger;

        public PublishMessageLoggingFilter(ILogger<PublishMessageLoggingFilter<T>> logger) {
            _logger = logger;
        }

        public async Task Send(PublishContext<T> context, IPipe<PublishContext<T>> next) {
            if (context.Message is PublishMessage message)
                _logger.LogTrace("Sending message to {Endpoint}({EndpointType}) {Message}", message.Endpoint, message.EndpointType,
                    message.Message.Text);

            await next.Send(context);
        }

        public void Probe(ProbeContext context) {
            context.CreateFilterScope("logging");
        }
    }
}