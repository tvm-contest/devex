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

//
// Hard code
//
const TEST_COLLESTION = path.resolve(globals.RESULT_COLLECTION, '3c55281ef9920955ddcec824a7db1421fb790e84bd34f8ad90e3177f65f9c3e7');

async function logEvents(params, response_type) {
    console.log(`params = ${JSON.stringify(params, null, 2)}`);
    console.log(`response_type = ${JSON.stringify(response_type, null, 2)}`);
}

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
        //
        // Hard paths
        //
        let rootNftContract = fs.readFileSync(path.resolve(TEST_COLLESTION, "NftRoot.sol")).toString();
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, TEST_COLLESTION, 'NftRoot');
        console.log(await rootNftAccount.getAddress());

        const mintMessage = await this.getMintMessage(
            rootNftAccount,
            'mintNft',
            {
                //
                // Hard code parameters
                //
                name: utf8ToHex(""),
                url: utf8ToHex(""),
                editionNumber: 1,
                editionAmount: 1,
                managersList: [""],
                royalty: 1,
                nftType: utf8ToHex('rarity'),
                heroPower: 10,
                arm: utf8ToHex('gun')
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
            value: '11000000000'
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