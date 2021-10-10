using System;

namespace Notifon.Server.Configuration.Options {
    public class RetryPolicyOptions {
        public int Count { get; set; }
        public TimeSpan Interval { get; set; }
    }
}