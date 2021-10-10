using System;
using System.Numerics;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client.Models;
using ch1seL.TonNet.Serialization;
using MassTransit;
using Notifon.Server.Utils;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonDeployConsumer : IConsumer<FreeTonDeploy> {
        private const string SafeMultisigWallet = "SafeMultisigWallet";

        private readonly ITonClient _tonClient;
        private readonly ITonPackageManager _tonPackageManager;

        public FreeTonDeployConsumer(ITonClient tonClient, ITonPackageManager tonPackageManager) {
            _tonClient = tonClient;
            _tonPackageManager = tonPackageManager;
        }

        public async Task Consume(ConsumeContext<FreeTonDeploy> context) {
            var cancellationToken = context.CancellationToken;
            var phrase = context.Message.Phrase;
            var keyPair = await _tonClient.Crypto.MnemonicDeriveSignKeys(new ParamsOfMnemonicDeriveSignKeys { Phrase = phrase },
                cancellationToken);

            var contract = await _tonPackageManager.LoadPackage(SafeMultisigWallet);

            var paramsOfEncodedMessage = new ParamsOfEncodeMessage {
                Abi = contract.Abi,
                DeploySet = new DeploySet {
                    Tvc = contract.Tvc,
                    InitialData = new { }.ToJsonElement()
                },
                CallSet = new CallSet {
                    FunctionName = "constructor",
                    Input = new { owners = new[] { $"0x{keyPair.Public}" }, reqConfirms = 0 }.ToJsonElement()
                },
                Signer = new Signer.Keys { KeysAccessor = keyPair },
                ProcessingTryIndex = 1
            };

            var encodeMessage = await _tonClient.Abi.EncodeMessage(paramsOfEncodedMessage, cancellationToken);
            var address = encodeMessage.Address;

            var result = await _tonClient.Net.QueryCollection(new ParamsOfQueryCollection {
                Collection = "accounts",
                Filter = new { id = new { eq = address } }.ToJsonElement(),
                Result = "acc_type balance"
            }, cancellationToken);

            if (result.Result.Length == 0) {
                await context.RespondAsync(new FreeTonDeployResult {
                    Success = false,
                    Balance = 0,
                    Error = $"You need to transfer at least 0.5 tokens for deploy to {address}",
                    Address = address,
                    KeyPair = keyPair
                });
            }

            var account = result.Result[0];
            var balance = new BigInteger(Convert.ToUInt64(account.Get<string>("balance"), 16)).ToDecimalBalance();
            var accType = account.Get<int>("acc_type");
            switch (accType) {
                case 0 when balance < (decimal)0.5:
                case 1:
                    await context.RespondAsync(new FreeTonDeployResult {
                        Success = true,
                        Balance = balance,
                        Error = $"Balance of ${address} is too low for deploy",
                        Address = address,
                        KeyPair = keyPair
                    });
                    return;
            }

            await _tonClient.Processing.ProcessMessage(new ParamsOfProcessMessage {
                SendEvents = false,
                MessageEncodeParams = paramsOfEncodedMessage
            }, cancellationToken: cancellationToken);

            var accBalance = await _tonClient.Net.QueryCollection(new ParamsOfQueryCollection {
                Collection = "accounts",
                Filter = new { id = new { eq = address } }.ToJsonElement(),
                Result = "balance"
            }, cancellationToken);

            balance = new BigInteger(Convert.ToUInt64(accBalance.Result[0].Get<string>("balance"), 16)).ToDecimalBalance();
            await context.RespondAsync(new FreeTonDeployResult {
                Success = true,
                Balance = balance,
                Error = $"Balance of ${address} is too low for deploy",
                Address = address,
                KeyPair = keyPair
            });
        }
    }
}