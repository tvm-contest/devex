using System;
using System.Text.Json;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client.Models;
using ch1seL.TonNet.Serialization;
using MassTransit;
using Microsoft.Extensions.Logging;
using Notifon.Server.Business.Models;
using Notifon.Server.Utils;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FormatDecryptedMessageConsumer : IConsumer<FormatDecryptedMessage> {
        private const string TransferContract = "transfer";
        private const string SafeMultisigWalletContract = "SafeMultisigWallet";
        private const string EmptyBody = "te6ccgEBAQEAAgAAAA==";
        private readonly ILogger<FormatDecryptedMessageConsumer> _logger;
        private readonly ITonClient _tonClient;
        private readonly ITonPackageManager _tonPackageManager;

        public FormatDecryptedMessageConsumer(ITonClient tonClient, ITonPackageManager tonPackageManager,
            ILogger<FormatDecryptedMessageConsumer> logger) {
            _tonClient = tonClient;
            _tonPackageManager = tonPackageManager;
            _logger = logger;
        }

        public async Task Consume(ConsumeContext<FormatDecryptedMessage> context) {
            var message = context.Message.DecryptedMessage;
            var format = context.Message.Format;
            var cancellationToken = context.CancellationToken;

            if (format.Equals("body", StringComparison.OrdinalIgnoreCase)) {
                var msg = JsonDocument.Parse(message.Text).RootElement;
                var isInternal = msg.Get<int>("msg_type") == 0;

                var abi = isInternal
                    ? await _tonPackageManager.LoadAbi(TransferContract)
                    : await _tonPackageManager.LoadAbi(SafeMultisigWalletContract);

                string text;
                if (msg.Get<string>("body") == EmptyBody) {
                    text = "<Empty comment>";
                }
                else {
                    var messageBody = await _tonClient.Abi.DecodeMessage(new ParamsOfDecodeMessage {
                        Abi = abi,
                        Message = msg.Get<string>("boc")
                    }, cancellationToken);

                    text = isInternal
                        ? messageBody.Value.Get<string>("body").HexToString()
                        : messageBody.Value.ToString();
                }

                await context.RespondAsync<FormattedMessage>(new { Text = text });
            }

            await context.RespondAsync<DummyResponse>(new { });
        }
    }
}