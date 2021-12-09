import { Account } from "@tonclient/appkit";
import { signerKeys, TonClient } from "@tonclient/core";
import { libNode } from "@tonclient/lib-node";
import path from "path";
import * as fs from 'fs';
// const IPFS = require('ipfs-core');
// const getResponse = require('ipfs-http-response');
import { everscale_settings } from "../config/everscale-settings";
import { globals } from "../config/globals";
import { nft_setting } from "../config/standart-nft-setting";

export type TokenInfo = {
  addrData : string
  addrRoot : string
  addrOwner : string
  addrTrusted : string
  color : string
}

export class TokenInfoBuilder {
  private client: TonClient;

  constructor(){
    TonClient.useBinaryLibrary(libNode);

    this.client = new TonClient({
      network: {
        endpoints: [everscale_settings.ENDPOINTS]
      }
    });

  }

  destructor() : void {
      this.client.close();
  }

  async getTokenInfo(address: string) : Promise<string[]>{

    let tokenAccount = new Account( { abi: nft_setting.INFO_DATA_ABI } , {
      address: address,
      signer: undefined,
      client: this.client
    });
    let getInfo = await tokenAccount.runLocal("getInfoResponsible", {"_answer_id":21});
    let addrRoot = getInfo.decoded?.output.addrRoot

    let fullAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.RESULT_COLLECTION, addrRoot.slice(2), "Data.abi.json")).toString());
    tokenAccount = new Account( { abi: fullAbi } , {
      address: address,
      signer: undefined,
      client: this.client
    });

    getInfo = await tokenAccount.runLocal("getInfo", {});

    let output = getInfo.decoded?.output
    let respons : string[] = []

    for (let key in output){
      switch(key){
        case('addrRoot'): respons.push(`Адрес коллекции: ${output[key]}`) ; break;
        case('addrOwner'): respons.push(`Адрес владельца: ${output[key]}`); break;
        case('addrAuthor'): respons.push(`Адрес автора: ${output[key]}`); break;
        case('addrData'): respons.push(`Адрес токена: ${output[key]}`); break;
        case('id'): respons.push(`ID: ${output[key]} `); break;
        case('name'): respons.push(`Название: ${Buffer.from(output[key], 'hex').toString()}`); break;
        case('url'): respons.push(`URL: ${Buffer.from(output[key], 'hex').toString()}`); break;
        case('number'): respons.push(`Number: ${output[key]} `); break;
        case('amount'): respons.push(`Amount:  ${output[key]} `); break;
        case('nftType'): respons.push(`Редкость: ${Buffer.from(output[key], 'hex').toString()} `); break;
        default: respons.push(`${key}: ${Buffer.from(output[key], 'hex').toString()} `); break;
      }
    }

    return respons

  }

  
}