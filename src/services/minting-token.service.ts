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
        const walletAcc = await this.getWalletAccount(dataForMinting.body.checkSignToken, dataForMinting.body.seedPhrase, dataForMinting.body.signAddress)

        
        let res = await rootNftAccount.runLocal('getFutureAddress', {})
        const tokenFutureAddress = res.decoded?.output.tokenFutureAddress

        await this.sendTransactionAndMint(walletAcc, rootNftAccount, mesBody);
        
        // Part for preventing root page loading before minting token ****
        let status = 0
        while(status != 1) {
            const delay = (ms : number) => new Promise(resolve => setTimeout(resolve, ms));
            await delay(500);
            let { result } = await this.client.net.query({
                query: "{accounts(filter:{id:{eq:\"" + tokenFutureAddress + "\"}}){acc_type}}"
            });
            if (result.data.accounts[0] !== undefined) {
                status = result.data.accounts[0].acc_type;
            }
        }
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

    private async getWalletAccount(checkSignToken, seedPhrase, address){
        let walletAbi = surf_setting.SEND_TRANSACTION_ABI;
        let walletAddr;
        let walletKey;

        if (checkSignToken == '') {
            walletKey = await this.getKeyPair(seedPhrase)
            walletAddr = address ;
        } else {
            walletKey = everscale_settings.SAFE_MULTISIG_KEYS;
            walletAddr = everscale_settings.SAFE_MULTISIG_ADDRESS;
        }

        const walletAcc = new Account(
            {
                abi: walletAbi
            },
            {
                address: walletAddr,
                client: this.client,
                signer: {
                    type: "Keys",
                    keys: walletKey
                }
            }
        );
        return walletAcc
    }

    private async getKeyPair(seedPhrase) {

        const keyPair = await this.client.crypto.mnemonic_derive_sign_keys({
            phrase: seedPhrase,
            path: everscale_settings.HD_PATH,
            dictionary: everscale_settings.SEED_PHRASE_DICTIONARY_ENGLISH,
            word_count: everscale_settings.SEED_PHRASE_WORD_COUNT,
        });
        
        return keyPair
    }

    private async sendTransactionAndMint(walletAcc: Account, nftRootAcc: Account, mesBody: string) {
        await walletAcc.run(
            "sendTransaction",
            {
                dest: await nftRootAcc.getAddress(),
                value: await this.getPrice(await walletAcc.getAddress()),
                flags: 3,
                bounce: true,
                payload: mesBody,
            }
        );
    }

    private async getPrice(adderess: string) : Promise<number> {
        const collectionInfo = fs.readFileSync(
            path.resolve(this.collectionFolder, 'collectionInfo.json')
        ).toString();
        const collectionInfoJSON = JSON.parse(collectionInfo);
        
        let mintingPriceUsers = collectionInfoJSON.commissions.mintingPriceUsers
        let price : number

        if ( 
            adderess != everscale_settings.SAFE_MULTISIG_ADDRESS &&
            mintingPriceUsers && 
            Number(mintingPriceUsers) > everscale_settings.MIN_MINTING_PRICE
        ) {
            price = Number(mintingPriceUsers) * 1_000_000_000
        } else {
            price = everscale_settings.MIN_MINTING_PRICE * 1_000_000_000
        }

        return price
    }

    private async getIpfsURL(file) : Promise<string>{
        let cid = await addFileToIPFS(file.data) 
        return `${ipfs_setting.GATEWAY}/ipfs/${cid}`
    }
}