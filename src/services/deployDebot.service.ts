import * as fs from 'fs';
import path from 'path';
import { Account } from '@tonclient/appkit';
import { TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import { globals } from '../config/globals'
import { everscale_settings } from '../config/everscale-settings';
import { DeployService } from './deploy.service';


export class DeployDebotService {
    private client: TonClient;
    private deployService: DeployService;

    constructor() {
        TonClient.useBinaryLibrary(libNode);

        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });

        this.deployService = new DeployService();
    }

    async deployDebot(contractsDir, rootNftAddress: string) : Promise<string> {
        let debotCode = fs.readFileSync(path.resolve(contractsDir, "debots", "MintingDebot.sol")).toString();
        let initData = {
            _addrNFTRoot: rootNftAddress
        };
        let debotAcc = await this.deployService.createContractAccount(debotCode, path.resolve(contractsDir, "debots"), "MintingDebot", initData);
        let walletAcc = await this.getWalletAcc();
        let debotTvc = fs.readFileSync(path.resolve(contractsDir, "debots", "MintingDebot.tvc"), {encoding: 'base64'});
        let debotAddress = await debotAcc.getAddress();
        await walletAcc.run(
            "sendTransaction",
            {
                dest: debotAddress,
                value: 2_000_000_000,
                flags: 2,
                bounce: false,
                payload: "",
            }
        );
        try {
            await this.client.processing.process_message({
                message_encode_params: {
                    abi: debotAcc.abi,
                    signer: {
                        type: "Keys",
                        keys: everscale_settings.KEYS
                    },
                    deploy_set: {
                        initial_data: initData,
                        tvc: debotTvc
                    },
                    call_set: {
                        function_name: "constructor",
                        input: {}
                    },
                    address: debotAddress
                },
                send_events: false
            });
            let abi = fs.readFileSync(path.join(contractsDir, 'debots', 'MintingDebot.abi.json'), "utf8");
            const buf = Buffer.from(abi, "ascii");
            const hexvalue = buf.toString("hex");
            await this.client.processing.process_message({
                message_encode_params: {
                    abi: debotAcc.abi,
                    address: debotAddress,
                    signer: {
                        type: "Keys",
                        keys: everscale_settings.KEYS
                    },
                    call_set: {
                        function_name: "setABI",
                        input: {
                            dabi: hexvalue
                        }
                    },
                },
                send_events: true,
            });
            
            console.log("Debot address: " + debotAddress);
            return debotAddress;
        } catch(err) {
            console.log(err);
            return "0";
        }
    }

    // This is a SafeMultisig Wallet contract for testing purposes.
    // In TON OS SE this contract is predeployed at 0:d5f5cfc4b52d2eb1bd9d3a8e51707872c7ce0c174facddd0e06ae5ffd17d2fcd 
    // address with one single custodian and its initial balance is about 1 million tokens.
    private async getWalletAcc() : Promise<Account> {
        let walletAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.SAMPLE_DATA_PATH, "safeMultisigWallet", "SafeMultisigWallet.abi.json")).toString());
        let walletTvc = fs.readFileSync(path.resolve(globals.SAMPLE_DATA_PATH, "safeMultisigWallet", "SafeMultisigWallet.tvc"), {encoding: 'base64'});
        const walletAcc = new Account(
            {
                abi: walletAbi, 
                tvc: walletTvc
            },
            {
                client: this.client,
                address: everscale_settings.SAFE_MULTISIG_ADDRESS,
                signer: {
                    type: "Keys",
                    keys: everscale_settings.SAFE_MULTISIG_KEYS
                }
            }
        );
        return walletAcc;
    }
}