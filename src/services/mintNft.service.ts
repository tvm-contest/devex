import path from 'path';
import fs from 'fs';
import { Account } from '@tonclient/appkit';
import { globals } from '../config/globals';
import { DeployService } from './deploy.service';

import { TestTokenModel } from '../routes/mint';

const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
const utf8ToHex = convert("utf8", "hex");


export class MintNftService {
    private deployService: DeployService;

    constructor() {
        this.deployService = new DeployService();
    }

    async mintNft(mintParams: TestTokenModel) {
        let rootNftContract = fs.readFileSync(path.resolve(globals.CONTRACTS_ROOT, "NftRoot.sol")).toString();
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, globals.CONTRACTS_ROOT);

        //
        // Нужнен уже задеплоиный аккаунт рута
        //

        let body = await this.getBody(rootNftAccount, mintParams);
        let walletAcc = await this.getWalletAcc(rootNftAccount);
        let rootNftAddress = await rootNftAccount.getAddress();
        
        await this.makeTransaction(walletAcc, rootNftAddress, body);
    }

    private async getBody(
        rootNftAccount: Account,
        callParams: TestTokenModel
    ): Promise<string> {
        let { body } = await rootNftAccount.client.abi.encode_message_body({
            abi: rootNftAccount.abi,
            signer: rootNftAccount.signer,
            is_internal: true,
            call_set: {
                function_name: "mintNft",
                // цвет захардкожен
                input: { nftType: utf8ToHex(callParams.tokenRarity), color: 4 }
            },
        });
        return body;
    }

    private async makeTransaction(walletAcc: Account, rootNftAddress: string, body: string): Promise<any> {
        let { transaction } = await walletAcc.run(
            "sendTransaction",
            {
                dest: rootNftAddress,
                value: 2_000_000_000,
                flags: 3,
                bounce: true,
                payload: body,
            }
        );
    }

    private async getWalletAcc(rootNftAccount: Account): Promise<Account> {
        let walletAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.BASE_PATH, "src", "sample-data", "safeMultisigWallet", "SafeMultisigWallet.abi.json")).toString());
        let walletTvc = fs.readFileSync(path.resolve(globals.BASE_PATH, "src", "sample-data", "safeMultisigWallet", "SafeMultisigWallet.tvc"), { encoding: 'base64' });
        const walletAcc = new Account(
            {
                abi: walletAbi,
                tvc: walletTvc
            },
            {
                client: rootNftAccount.client,
                address: "0:d5f5cfc4b52d2eb1bd9d3a8e51707872c7ce0c174facddd0e06ae5ffd17d2fcd",
                signer: {
                    type: "Keys",
                    keys: {
                        public: "99c84f920c299b5d80e4fcce2d2054b05466ec9df19532a688c10eb6dd8d6b33",
                        secret: "73b60dc6a5b1d30a56a81ea85e0e453f6957dbfbeefb57325ca9f7be96d3fe1a"
                    }
                }
            }
        );
        return walletAcc;
    }
}