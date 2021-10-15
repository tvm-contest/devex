namespace Notifon.Server.Configuration.Options {
    public class AppOptions {
        public string Name { get; set; }
        public string Url { get; set; }
        public string Logo => string.Format($"{Url}logo.png");
        public string GitHub { get; set; }
        public string Telegram { get; set; }
        public string ServicePurpose { get; set; }
        public string ServiceDescription { get; set; }
        public string NotificationDeBot { get; set; }
    }
}