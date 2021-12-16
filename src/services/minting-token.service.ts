import path from 'path';
import fs from 'fs';
import { Account } from '@tonclient/appkit';
import { globals } from '../config/globals';
import { DeployService } from './deploy.service';
import { TonClient } from '@tonclient/core';
import { everscale_settings } from '../config/everscale-settings';
import { addFileToIPFS } from './add-ipfs.service';
import { ipfs_setting } from '../config/ipfs-setting';
import { surf_setting } from '../config/surf_setting';

const convert = (from, to) => (str) => Buffer.from(str, from).toString(to);
const utf8ToHex = convert("utf8", "hex");

export class MintNftService {
    private deployService: DeployService;
    private client: TonClient;
    private collectionFolder: string = '';

    constructor(collectionRootAddress: string) {
        this.deployService = new DeployService();
        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        });
        // Collection folder is the root address withot the 0: in the front
        this.setCollectionSourceFolder(collectionRootAddress.substring(2));
    }

    private setCollectionSourceFolder(collectionFolder: string) {
        this.collectionFolder = path.resolve(globals.RESULT_COLLECTION, collectionFolder);
    }

    private getCollectionSourceFolder() {
        return this.collectionFolder;
    }

    async mintNft(dataForMinting) {
        const rootNftContract = fs.readFileSync(path.resolve(this.getCollectionSourceFolder(), "NftRoot.sol")).toString();
        const rootNftAccount = await this.deployService.createContractAccount(
            rootNftContract,
            this.collectionFolder,
            'NftRoot',
            { _name: utf8ToHex(dataForMinting.body.contractName) }
        );

        const mintParams = await this.getMintParams(dataForMinting);

        const mesBody = await this.getMessageBody(
            rootNftAccount,
            'mintNft',
            mintParams
        );

        const walletAcc = await this.getWalletAccount()

        await this.sendTransactionAndMint(walletAcc, rootNftAccount, mesBody)
    }

    async getMintParams(mintigData): Promise<object> {
        //Data which user inputted to the form
        const userParams = mintigData.body;
        // const userEnum = userParams.enum;
        const userMediaFile = mintigData.files;

        const resultParams = {
            name: utf8ToHex(userParams.contractName),
            url: utf8ToHex(""),
            editionNumber: 1,
            editionAmount: 1,
            managersList: [],
            royalty: 1,
            nftType: userParams.rarities ? utf8ToHex(userParams.rarities) : ""
        };

        // Data from the collectionInfo.json
        const collectionInfo = fs.readFileSync(
            path.resolve(this.collectionFolder, 'collectionInfo.json')
        ).toString();
        const collectionInfoJSON = JSON.parse(collectionInfo);
        const collectionParams = collectionInfoJSON.collection.parameters;
        const enumOfCollection = collectionInfoJSON.enums;
        const mediafilesOfCollection = collectionInfoJSON.mediafiles;

        for (const currentCollecitonParam of collectionParams) {
            // For uint and string params
            if (currentCollecitonParam.name in userParams) {
                if (currentCollecitonParam.type === 'uint') {
                    resultParams[currentCollecitonParam.name] = userParams[currentCollecitonParam.name];
                } else if (currentCollecitonParam.type === 'string') {
                    resultParams[currentCollecitonParam.name] = utf8ToHex(userParams[currentCollecitonParam.name]);
                }
            }
        }

        for (const currentEnum of enumOfCollection) {
            // If a enum there is no in the collectionInfo.json this loop will not work
            resultParams[currentEnum.name] = Number(userParams[currentEnum.name]);
        }

        for (const currentMediafile of mediafilesOfCollection) {
            // If a mediafile there is no in the collectionInfo.json this loop will not work 
            resultParams[currentMediafile.name] = utf8ToHex(await this.getIpfsURL(userMediaFile[currentMediafile.name]));
        }

        return resultParams;
    }

    private async getMessageBody(account: Account, func: string, input: object) {
        const messageParams = {
            abi: account.abi,
            call_set: {
                function_name: func,
                input
            },
            is_internal: true,
            signer: account.signer
        };
        let payload =  await this.client.abi.encode_message_body(messageParams);

        return payload.body
    }

    private async getWalletAccount(){
        let walletAbi = surf_setting.SEND_TRANSACTION_ABI
        const walletAcc = new Account(
            {
                abi: walletAbi, 
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
        return walletAcc
    }

    private async sendTransactionAndMint(walletAcc: Account, nftRootAcc: Account, mesBody: string) {
        await walletAcc.run(
            "sendTransaction",
            {
                dest: await nftRootAcc.getAddress(),
                value: 2_000_000_000,
                flags: 3,
                bounce: true,
                payload: mesBody,
            }
        );
    }

    private async getIpfsURL(file) : Promise<string>{
        let cid = await addFileToIPFS(file.data) 
        return `${ipfs_setting.GATEWAY}/ipfs/${cid}`
    }
}