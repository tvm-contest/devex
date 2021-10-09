namespace Notifon.Server.Business {
    public enum CommandType {
        [CommandDescription(null, "[endpoint] [parameters]' register endpoint or update parameters")]
        AddEndpoint,

        [CommandDescription("help", "'{command}' show this tip")]
        Help,

        [CommandDescription("list", "'{command}' get registered endpoints")]
        ListEndpoints,

        [CommandDescription("remove", "'{command} [endpoint]' unregister endpoint")]
        RemoveEndpoint,

        [CommandDescription("clear", "'{command}' unregister all endpoints")]
        ClearEndpoints,

        [CommandDescription("secret", "'{command} [SECRET_KEY|get|remove]' set decryption key, use remove to delete")]
        Secret,

        [CommandDescription("test", "'{command} [parameters]' add test HTTP endpoint")]
        Test
    }
}