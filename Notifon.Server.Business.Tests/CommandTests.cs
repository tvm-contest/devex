using System.Collections.Generic;
using System.Text.Json;
using FluentAssertions;
using Xunit;

namespace Notifon.Server.Business.Tests {
    public class CommandTests {
        [Theory]
        [InlineData("test", CommandType.Test, "{}")]
        [InlineData("test -d", CommandType.Test, "{\"d\":null}")]
        [InlineData("secret", CommandType.Secret, "{}")]
        [InlineData("secret Super:SecretKey", CommandType.Secret, "{\"mainParam\":\"Super:SecretKey\"}")]
        [InlineData("http://endpoint -d -a:testa -b:testb:b", CommandType.AddEndpoint,
            "{\"mainParam\":\"http://endpoint\", \"d\":null, \"b\":\"testb:b\", \"a\":\"testa\"}")]
        [InlineData("help", CommandType.Help, "{}")]
        public void CreateCommandFromData(string data, CommandType expectedCommandType, string expectedParametersJson) {
            var expectedParameters = JsonSerializer.Deserialize<Dictionary<string, string>>(expectedParametersJson);

            var command = Command.FromData(data);

            command.CommandType.Should().Be(expectedCommandType);
            command.Parameters.Should().Equal(expectedParameters);
        }
    }
}