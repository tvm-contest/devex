using System;
using System.Collections.Generic;
using Notifon.Server.Business.Exceptions;
using Notifon.Server.Configuration.Options;
using Notifon.Server.Models;

namespace Notifon.Server.Business.Models {
    public class MailgunParameters {
        private MailgunParameters(string text, string to, string apiKey, string from, string domain, string subject) {
            Text = text;
            To = to;
            From = from;
            ApiKey = apiKey;
            Subject = subject;
            Domain = domain;
        }

        public string Text { get; }
        public string To { get; }
        public string From { get; }
        public string ApiKey { get; }
        public string Subject { get; }
        public string Domain { get; }

        public static MailgunParameters Create(PublishMessage @base, Func<MailGunOptions> mailgunOptionsFactory) {
            var apiKey = @base.Parameters.GetValueOrDefault("mk")
                         ?? mailgunOptionsFactory().ApiKey
                         ?? throw new NoRequiredParametersException();

            var from = @base.Parameters.GetValueOrDefault("mf")
                       ?? mailgunOptionsFactory().From
                       ?? throw new NoRequiredParametersException();

            var domain = @base.Parameters.GetValueOrDefault("md")
                         ?? mailgunOptionsFactory().Domain
                         ?? throw new NoRequiredParametersException();

            var subject = @base.Parameters.GetValueOrDefault("ms")
                          ?? mailgunOptionsFactory().Subject
                          ?? throw new NoRequiredParametersException();

            return new MailgunParameters(@base.Message.Text, @base.Endpoint, apiKey, from, domain, subject);
        }
    }
}