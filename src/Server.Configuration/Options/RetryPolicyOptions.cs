using System;

namespace Server.Options {
    public class RetryPolicyOptions {
        public int Count { get; set; } = 0;
        public TimeSpan Interval { get; set; } = TimeSpan.Zero;
    }
}