import path from 'path';
import fs from 'fs';
import { Account } from '@tonclient/appkit';
import { globals } from '../config/globals';
import { DeployService } from './deploy.service';
import { TonClient } from '@tonclient/core';
import { everscale_settings } from '../config/everscale-settings';
import { TokenImageCreator } from './gen-token-image.service';

const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
const utf8ToHex = convert("utf8", "hex");

//
// Hard code
//
const TEST_COLLESTION = path.resolve(globals.RESULT_COLLECTION, '61660447d14fd0312cb5240985d0be7d4fbe3c6b14f8a59452c05a945cd00a40');

export class MintNftService {
    private deployService: DeployService;
    private client: TonClient;
    private collectionSrcFolder: string;
    private imageCreator: TokenImageCreator;

    constructor(collectionSrcFolder: string) {
        this.deployService = new DeployService();
        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });

        this.imageCreator = new TokenImageCreator;
        this.collectionSrcFolder = '';
        this.setCollectionSourceFolder(collectionSrcFolder);
    }

    private setCollectionSourceFolder(collectionSrcFolder: string) {
        this.collectionSrcFolder = collectionSrcFolder;
    }

    private getCollectionSourceFolder() {
        return this.collectionSrcFolder;
    }

    async mintNft() {
        //
        // Hard paths
        //
        let rootNftContract = fs.readFileSync(path.resolve(TEST_COLLESTION, "NftRoot.sol")).toString();
        let rootNftAccount = await this.deployService.createContractAccount(rootNftContract, TEST_COLLESTION, 'NftRoot', {_name: utf8ToHex('Warrior')});

        const mintMessage = await this.getMintMessage(
            rootNftAccount,
            'mintNft',
            {
                name: utf8ToHex(""),
                url: utf8ToHex(""),
                editionNumber: 1,
                editionAmount: 1,
                managersList: [],
                royalty: 1,
                //
                // Hard code parameters
                //
                nftType: utf8ToHex('rarity'),
                power: 3
            }
        );

        await this.sendMessageToMint(mintMessage.message);
        this.imageCreator.createTokenImage('61660447d14fd0312cb5240985d0be7d4fbe3c6b14f8a59452c05a945cd00a40');
    }

    private async getMintMessage(account: Account, func: string, input: object) {
        const messageParams = {
            abi: account.abi,
            address: await account.getAddress(),
            //
            // Hard code
            //
            src_address: everscale_settings.SAFE_MULTISIG_ADDRESS,

            call_set: {
                function_name: func,
                input
            },
            value: '2000000000'
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