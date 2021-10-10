using System;
using System.Numerics;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client.Models;
using ch1seL.TonNet.Serialization;
using MassTransit;
using Notifon.Server.Utils;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonSendMessageConsumer : IConsumer<FreeTonSendMessage> {
        private const string SafeMultisigWallet = "SafeMultisigWallet";
        private const string Transfer = "transfer";
        private readonly IRequestClient<FreeTonDeploy> _freeTonDeployClient;

        private readonly ITonClient _tonClient;
        private readonly ITonPackageManager _tonPackageManager;

        public FreeTonSendMessageConsumer(ITonClient tonClient, ITonPackageManager tonPackageManager,
            IRequestClient<FreeTonDeploy> freeTonDeployClient) {
            _tonClient = tonClient;
            _tonPackageManager = tonPackageManager;
            _freeTonDeployClient = freeTonDeployClient;
        }

        public async Task Consume(ConsumeContext<FreeTonSendMessage> context) {
            var cancellationToken = context.CancellationToken;
            var phrase = context.Message.Phrase;
            var recipient = context.Message.Recipient;
            var message = context.Message.Message;

            var contract = await _tonPackageManager.LoadPackage(SafeMultisigWallet);
            var transferAbi = await _tonPackageManager.LoadAbi(Transfer);

            var deployResult = await _freeTonDeployClient.GetResponse<FreeTonDeployResult>(new {
                Phrase = phrase
            }, cancellationToken);
            var deployResultMessage = deployResult.Message;
            if (!deployResultMessage.Success) {
                await context.RespondAsync(new FreeTonSendMessageResult {
                    Success = false,
                    Balance = deployResultMessage.Balance,
                    Error = deployResultMessage.Error,
                    Address = deployResultMessage.Address
                });
            }

            var keyPair = deployResultMessage.KeyPair;
            var address = deployResultMessage.Address;
            var body = await _tonClient.Abi.EncodeMessageBody(new ParamsOfEncodeMessageBody {
                Abi = transferAbi,
                CallSet = new CallSet {
                    FunctionName = "transfer",
                    Input = new { comment = message.ToHexString() }.ToJsonElement()
                },
                IsInternal = true,
                Signer = new Signer.None()
            }, cancellationToken);

            var result = await _tonClient.Processing.ProcessMessage(new ParamsOfProcessMessage {
                SendEvents = false,
                MessageEncodeParams = new ParamsOfEncodeMessage {
                    Abi = contract.Abi,
                    Address = deployResult.Message.Address,
                    CallSet = new CallSet {
                        FunctionName = "submitTransaction",
                        Input = new {
                            dest = recipient,
                            value = 100_000_000,
                            bounce = false,
                            allBalance = false,
                            payload = body.Body
                        }.ToJsonElement()
                    },
                    Signer = new Signer.Keys { KeysAccessor = keyPair }
                }
            }, cancellationToken: cancellationToken);

            var accBalance = await _tonClient.Net.QueryCollection(new ParamsOfQueryCollection {
                Collection = "accounts",
                Filter = new { id = new { eq = address } }.ToJsonElement(),
                Result = "balance"
            }, cancellationToken);

            var balance = new BigInteger(Convert.ToUInt64(accBalance.Result[0].Get<string>("balance"), 16)).ToDecimalBalance();

            await context.RespondAsync(new FreeTonSendMessageResult {
                Success = true,
                Balance = balance,
                Address = address,
                Messages = result.Transaction.Get<string[]>("out_msgs")
            });
        }
    }
}