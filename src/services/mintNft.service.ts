import path from 'path';
import fs from 'fs';
import { Account } from '@tonclient/appkit';
import { globals } from '../config/globals';
import { DeployService } from './deploy.service';
import { TonClient } from '@tonclient/core';
import { everscale_settings } from '../config/everscale-settings';

import { TestTokenModel } from '../routes/mint';

const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
const utf8ToHex = convert("utf8", "hex");

export class MintNftService {
    private deployService: DeployService;
    private client: TonClient;
    private collectionSrcFolder: string;

    constructor(collectionSrcFolder: string) {
        this.deployService = new DeployService();
        this.client = new TonClient({
            network: {  
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });

        this.collectionSrcFolder = '';
        this.setCollectionSourceFolder(collectionSrcFolder);
    }

    private setCollectionSourceFolder(collectionSrcFolder: string) {
        this.collectionSrcFolder = collectionSrcFolder;
    }

    private getCollectionSourceFolder() {
        return this.collectionSrcFolder;
    }

    async mintNft(mintParams: TestTokenModel) {
        let rootNftContract = fs.readFileSync(path.resolve(this.getCollectionSourceFolder(), "NftRoot.sol")).toString();
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, globals.CONTRACTS_ROOT);
        
        //
        // Нужнен уже задеплоиный аккаунт рута
        //

        const mintMessage = await this.getMintMessage(
            rootNftAccount,
            'mintNft',
            {
                nftType: utf8ToHex(mintParams.tokenRarity),
                color: mintParams.image
            }
        );

        await this.sendMessageToMint(mintMessage.message);
    }

    private async getMintMessage(account: Account, func: string, input: object) {
        const messageParams = {
            abi: account.abi,
            address: await account.getAddress(),
            call_set: {
                function_name: func,
                input
            },
            value: '1100000000'
        };

        return await this.client.abi.encode_internal_message(messageParams);
    }

    private async sendMessageToMint(message: string) {
        const shardIdParams = {
            message,
            send_events: false
        }

        await this.client.processing.send_message(shardIdParams);
    }
}