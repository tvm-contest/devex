import {  TonClient } from "@tonclient/core";
import { globals } from "../config/globals";
import { Account } from '@tonclient/appkit';
import { networks } from '../config/networks';
import fs from 'fs';

export class GetTokensList {

    private readonly client: TonClient;

    constructor() {
        this.client = new TonClient({
            network: {
                server_address: networks.TONDEV
            }
        });
    }
    
    async getTokensList(rootAddress: string, dirName: string): Promise<string[]> {

        const indexBasisAdddress = await this.getAddrBasis(rootAddress, dirName);
        const codeHashData = await this.getHashCodeData(indexBasisAdddress, dirName);
        
        console.log(codeHashData);
        let result = (await this.client.net.query_collection({
            collection: 'accounts',
            filter: {
            code_hash: {
                    eq: codeHashData
                }
            },
            result: 'id'
        })).result;
        let tokensList : string[] = []
        for (var key in result)
        {
            tokensList.push(result[key].id);
        }
        return tokensList;
       

    }

     private async getAddrBasis(rootAddress: string, dirName: string): Promise<string> {
        let rootAbi = await JSON.parse(fs.readFileSync(globals.TEMP_PATH + "\\" + dirName + "\\NftRoot.abi.json").toString());

        const account = new Account({
            abi: rootAbi
        }, {
            client: this.client,
            address: rootAddress,
        });

        const result = await account.runLocal('getAddrBasis', {});
        let res;
        if(result != undefined)
        {
            res =  result?.decoded?.output;
        }
        return res.addrBasis;
    }

    
    private async getHashCodeData(indexBasisAddress: string, dirName: string ): Promise<string> {
        let indexAbi = await JSON.parse(fs.readFileSync(globals.TEMP_PATH + "\\" + dirName + "\\IndexBasis.abi.json").toString());
        
        const account = new Account({
            abi: indexAbi
        }, {
            client: this.client,
            address: indexBasisAddress,
        });

        const result = await account.runLocal('getInfo', {});
        let res;
        if(result != undefined)
        {
            res =  result?.decoded?.output;
        }
        let codeHashData = res.codeHashData.split("x");
        return codeHashData[1];
    }
}