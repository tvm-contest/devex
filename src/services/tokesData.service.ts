import { TonClient } from "@tonclient/core";
import { everscale_settings } from "../config/everscale-settings";
import { libNode } from '@tonclient/lib-node';
import { Account } from "@tonclient/appkit";

// Для получения списка data нам необходим abi рут контракта для вызова метода resolveCodeHashData
// Не знаю куда его лучше запихнуть
import rootNftAbi from "../sample-data/trueNftSample/NftRoot.abi.json";

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
        return await message.decoded?.out_messages[0].value;;
    }

    private async getTokensDataCollection(codeHashData) : Promise<any[]> {
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