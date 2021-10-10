using System;
using System.Numerics;
using System.Threading;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client;
using ch1seL.TonNet.Client.Models;
using ch1seL.TonNet.Serialization;
using MassTransit;

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

            var keys = await _tonClient.Crypto.MnemonicDeriveSignKeys(new ParamsOfMnemonicDeriveSignKeys { Phrase = phrase },
                cancellationToken);

            string address;
            try {
                address = await Deploy(keys, cancellationToken);
            }
            catch (TonClientException ex) {
                await context.RespondAsync<FreeTonDeployResult>(new {
                    Success = false,
                    Error = ex.Message
                });
                return;
            }

            await context.RespondAsync<FreeTonDeployResult>(new {
                Success = true,
                Address = address
            });
        }

        private async Task<string> Deploy(KeyPair keyPair, CancellationToken cancellationToken) {
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
                Result = "acc_type balance code"
            }, cancellationToken);

            if (result.Result.Length == 0) throw new Exception($"You need to transfer at least 0.5 tokens for deploy to {address}");

            if (result.Result[0].Get<int>("acc_type") == 1) return address;

            if (result.Result[0].Get<int>("acc_type") == 0
                && new BigInteger(Convert.ToUInt64(result.Result[0].Get<string>("balance"), 16)) <= 500_000_000)
                throw new Exception($"Balance of ${address} is too low for deploy");

            await _tonClient.Processing.ProcessMessage(new ParamsOfProcessMessage {
                SendEvents = false,
                MessageEncodeParams = paramsOfEncodedMessage
            }, cancellationToken: cancellationToken);

            return address;
        }
    }
}