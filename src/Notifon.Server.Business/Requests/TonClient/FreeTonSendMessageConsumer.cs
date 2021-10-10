using System;
using System.Numerics;
using System.Text;
using System.Text.Json;
using System.Threading;
using System.Threading.Tasks;
using ch1seL.TonNet.Abstract;
using ch1seL.TonNet.Client;
using ch1seL.TonNet.Client.Models;
using ch1seL.TonNet.Serialization;
using MassTransit;

namespace Notifon.Server.Business.Requests.TonClient {
    public class FreeTonSendMessageConsumer : IConsumer<FreeTonSendMessage> {
        private const string SafeMultisigWallet = "SafeMultisigWallet";
        private const string Transfer = "transfer";

        private readonly ITonClient _tonClient;
        private readonly ITonPackageManager _tonPackageManager;

        public FreeTonSendMessageConsumer(ITonClient tonClient, ITonPackageManager tonPackageManager) {
            _tonClient = tonClient;
            _tonPackageManager = tonPackageManager;
        }

        public async Task Consume(ConsumeContext<FreeTonSendMessage> context) {
            var cancellationToken = context.CancellationToken;
            var phrase = context.Message.Phrase;
            var recipient = context.Message.Recipient;
            var message = context.Message.Message;

            var keys = await _tonClient.Crypto.MnemonicDeriveSignKeys(new ParamsOfMnemonicDeriveSignKeys { Phrase = phrase },
                cancellationToken);

            (BigInteger balance, JsonElement? transaction) result;
            try {
                result = await SendMessage(keys, recipient, message, cancellationToken);
            }
            catch (Exception ex) {
                await context.RespondAsync(new FreeTonSendMessageResult {
                    Success = false,
                    Error = ex.Message
                });
                return;
            }

            await context.RespondAsync(new FreeTonSendMessageResult {
                Success = true,
                Balance = Math.Round((decimal)BigInteger.Divide(result.balance, 1_000_000) / 1000, 2),
                Messages = result.transaction.Get<string[]>("out_msgs")
            });
        }

        private async Task<(BigInteger balance, JsonElement? transaction)> SendMessage(KeyPair keyPair, string recipient, string message,
            CancellationToken cancellationToken) {
            var contract = await _tonPackageManager.LoadPackage(SafeMultisigWallet);
            var transferAbi = await _tonPackageManager.LoadAbi(Transfer);

            var address = await Deploy(contract, keyPair, cancellationToken);

            var body = await _tonClient.Abi.EncodeMessageBody(new ParamsOfEncodeMessageBody {
                Abi = transferAbi,
                CallSet = new CallSet {
                    FunctionName = "transfer",
                    Input = new { comment = ToHexString(message) }.ToJsonElement()
                },
                IsInternal = true,
                Signer = new Signer.None()
            }, cancellationToken);

            var result = await _tonClient.Processing.ProcessMessage(new ParamsOfProcessMessage {
                SendEvents = false,
                MessageEncodeParams = new ParamsOfEncodeMessage {
                    Abi = contract.Abi,
                    Address = address,
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

            var balance = await GetBalance(cancellationToken, address);
            return (balance, result.Transaction);
        }

        private async Task<BigInteger> GetBalance(CancellationToken cancellationToken, string address) {
            var accBalance = await _tonClient.Net.QueryCollection(new ParamsOfQueryCollection {
                Collection = "accounts",
                Filter = new { id = new { eq = address } }.ToJsonElement(),
                Result = "balance"
            }, cancellationToken);
            return new BigInteger(Convert.ToUInt64(accBalance.Result[0].Get<string>("balance"), 16));
        }

        private async Task<string> Deploy(Package contract, KeyPair keyPair,
            CancellationToken cancellationToken) {
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
            var account = result.Result[0];

            var balance = new BigInteger(Convert.ToUInt64(account.Get<string>("balance"), 16));
            if (account.Get<int>("acc_type") == 0 && balance <= 500_000_000)
                throw new Exception($"Balance of ${address} is too low for deploy");
            if (account.Get<int>("acc_type") == 1) return address;

            await _tonClient.Processing.ProcessMessage(new ParamsOfProcessMessage {
                SendEvents = false,
                MessageEncodeParams = paramsOfEncodedMessage
            }, cancellationToken: cancellationToken);

            return address;
        }

        public static string ToHexString(string input) {
            var bytes = Encoding.Default.GetBytes(input);
            return BitConverter.ToString(bytes).Replace("-", string.Empty);
        }
    }
}