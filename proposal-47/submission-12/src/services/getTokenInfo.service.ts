import { ResultOfDecodeAccountData, TonClient } from "@tonclient/core";
import { networks } from '../config/networks';
import fs from "fs";
import { globals } from '../config/globals';

const { abiContract } = require("@tonclient/core");

export class TokenInfoGetter {

    private readonly client: TonClient;

    constructor() {
        this.client = new TonClient({
            network: {
                server_address: networks.TONDEV
            }
        });
    }

    async getTokenInfo(tokenAddress: string, dirName: string): Promise<ResultOfDecodeAccountData> {
        const tokenData = await this.getTokenData(tokenAddress);
        const tokenDecodedInfo: ResultOfDecodeAccountData = await this.getTokenDecodedInfo(tokenData, dirName);
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

    async getTokenDecodedInfo(tokenData: string,  dirName: string): Promise<ResultOfDecodeAccountData> {
        let dataAbi = await JSON.parse(fs.readFileSync(globals.TEMP_PATH + "\\" + dirName + "\\Data.abi.json").toString());
        const decodedDataOfToken = await this.client.abi.decode_account_data({
            abi: abiContract(dataAbi),  
            data: tokenData
        });
        return decodedDataOfToken;
    }
}
