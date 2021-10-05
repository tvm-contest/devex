using System;
using System.Net;
using System.Net.Http;
using GreenPipes;
using GreenPipes.Configurators;

namespace Server
{
    internal static class HttpRetryPolicy
    {
        public static void ConfigureHttpRetry(IRetryConfigurator configurator)
        {
            configurator.Ignore<HttpRequestException>(exception =>
                exception.StatusCode >= (HttpStatusCode?)400 && exception.StatusCode <= (HttpStatusCode?)499);
            configurator.Interval(144, TimeSpan.FromMinutes(10));
        }
    }
}