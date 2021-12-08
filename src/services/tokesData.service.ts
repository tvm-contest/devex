import { signerKeys, TonClient } from "@tonclient/core";
import { everscale_settings } from "../config/everscale-settings";
import { libNode } from '@tonclient/lib-node';
import { Account } from "@tonclient/appkit";
import * as fs from 'fs';
import { globals } from '../config/globals'
import path from 'path';

// Для получения списка data нам необходим abi рут контракта для вызова метода resolveCodeHashData
// Не знаю куда его лучше запихнуть

type RootNtfInfo = {
    name: string,
    icon: string
}

export class TokensData {
    private readonly client: TonClient;

    constructor() {
        TonClient.useBinaryLibrary(libNode);
        this.client = new TonClient({
            network: {
                endpoints: [everscale_settings.ENDPOINTS]
            }
        })
    }

    async getRootNftInfo(rootNftAddress: string) : Promise<RootNtfInfo> {
        try{
            let rootNftAccount = await this.getAccountByAddress(rootNftAddress);
            let rootNftIcon = (await rootNftAccount.runLocal("getIcon", {})).decoded?.output.icon;
            let rootNftName = (await rootNftAccount.runLocal("getName", {})).decoded?.output.name;
            rootNftName = Buffer.from(rootNftName, 'hex').toString()
            return {name: rootNftName, icon: rootNftIcon}
        } catch(err) {
            console.log(err);
            return {name: '', icon: ''};
        }
    }

    async getDebotAddress(rootNftAddress: string) : Promise<string>{
        let debotAbi = await JSON.parse(fs.readFileSync(path.join(globals.RESULT_COLLECTION, rootNftAddress, 'debots', 'MintingDebot.abi.json')).toString());
        let debotTvc = fs.readFileSync(path.join(globals.RESULT_COLLECTION, rootNftAddress, 'debots', 'MintingDebot.tvc'), {encoding: 'base64'});
        const debotAccount = new Account({
            abi: debotAbi,
            tvc: debotTvc
        }, {
            signer: signerKeys(everscale_settings.KEYS),
            client: this.client
        });

        return debotAccount.getAddress()
    }
    
    async getTokensData(rootNftAddress: string) : Promise<any[]>{
        try{
            let rootNftAccount = await this.getAccountByAddress(rootNftAddress);
            let { codeHashData } = await this.getCodeHashData(rootNftAccount, rootNftAddress);
            return await this.getTokensDataCollection(codeHashData);
        } catch(err) {
            console.log(err);
            return [];
        }
    }

    private async getAccountByAddress(rootNftAddress: string) : Promise<Account> {
        let rootNftAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.RESULT_COLLECTION, rootNftAddress, "NftRoot.abi.json")).toString());
        return new Account(
            {
                abi: rootNftAbi
            }, 
            {
                address: rootNftAddress, 
                signer: {
                    type: 'Keys',
                    keys: everscale_settings.KEYS
                },
                client: this.client
            }
        );
    }

    private async getCodeHashData(rootNftAccount: Account, rootNftAddress: string) : Promise<any> {
        let message = await this.client.tvm.run_tvm({
            message: (
                await this.client.abi.encode_message({
                    signer: {type: "Keys", keys: everscale_settings.KEYS},
                    abi: rootNftAccount.abi,
                    call_set: {
                        function_name: "resolveCodeHashData"
                    },
                    address: rootNftAddress,
                })
            ).message,
            account: await rootNftAccount.boc(),
            abi: rootNftAccount.abi,
        });
        return await message.decoded?.out_messages[0].value;
    }

    private async getTokensDataCollection(codeHashData: any) : Promise<any[]> {
        let tokensDataCollection = (
            await this.client.net.query_collection({
                collection: "accounts",
                filter: {
                    code_hash: { eq: codeHashData.slice(2) },
                },
                result: "id",
            })
        ).result;
        return tokensDataCollection;
    }
}