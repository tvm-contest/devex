import { ResultOfDecodeAccountData, TonClient } from "@tonclient/core";
import { networks } from '../config/networks';
import fs from "fs";
import { globals } from '../config/globals';
import path from "path/posix";
import { Account } from "@tonclient/appkit";

export class TokenInfoGetter {

    private readonly client: TonClient;

    constructor() {
        this.client = new TonClient({
            network: {
                server_address: networks.LOCALHOST
            }
        });
    }

    async getTokenInfo(tokenAddress: string, dirName: string) {
        const tokenDecodedInfo = await this.getTokenDecodedInfo(tokenAddress, dirName);

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

    async getTokenDecodedInfo(tokenAddress: string, dirName: string) {
        const abiPath = path.join(globals.TEMP_PATH, dirName, "Data.abi.json");
        let dataAbi = JSON.parse(fs.readFileSync(abiPath).toString());

        const dataAcc = new Account(
            {
                abi: dataAbi
            },
            {
                address: tokenAddress,
                client: this.client
            }
        );

        const tokenInfo = await dataAcc.runLocal('getInfo', {});
        const rarity = await dataAcc.runLocal('getRarity', {});

        return {
            addresses: tokenInfo.decoded?.output,
            rarity: rarity.decoded?.output.rarityName
        };
    }
}