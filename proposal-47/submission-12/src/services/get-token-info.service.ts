import { ResultOfDecodeAccountData, TonClient } from "@tonclient/core";
import { dataAbi } from "../contracts/abi/data-abi";

const { abiContract } = require("@tonclient/core");
import { networks } from '../config/networks';


export class TokenInfoGetter {

    private readonly client: TonClient;

    constructor() {
        this.client = new TonClient({
            network: {
                server_address: networks.TONDEV
            }
        });
    }

    async getTokenInfo(tokenAddress: string): Promise<ResultOfDecodeAccountData> {
        const tokenData = await this.getTokenData(tokenAddress);
        const tokenDecodedInfo: ResultOfDecodeAccountData = await this.getTokenDecodedInfo(tokenData);

        return tokenDecodedInfo;
    }

    async getTokenData(tokenAddress: string): Promise<string> {
        let tokenData = (await this.client.net.query_collection({
            collection: 'accounts',
            filter: {
                id: {
                    eq: tokenAddress
                }
            },
            result: 'data'
        })).result[0].data;

        return tokenData;
    }
   ///TODO: сделать на вход abi.json !!!!!!!!!!!!!!!!!!!!

    async getTokenDecodedInfo(tokenData: string): Promise<ResultOfDecodeAccountData> {
        const decodedDataOfToken = await this.client.abi.decode_account_data({
            abi: abiContract(dataAbi),
            data: tokenData
        });
        return decodedDataOfToken;
    }
}
