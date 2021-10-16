using Microsoft.Extensions.Logging;
using Polly;

namespace NotificationProvider.Functions.Extensions
{
    static public class ContextExtensions
    {
        static private readonly string LoggerKey = "LoggerKey";

        static public Context WithLogger(this Context context, ILogger logger)
        {
            context[LoggerKey] = logger;
            return context;
        }

        static public ILogger GetLogger(this Context context)
        {
            if (context.TryGetValue(LoggerKey, out object logger))
            {
                return logger as ILogger;
            }
            return null;
        }
    }
}
