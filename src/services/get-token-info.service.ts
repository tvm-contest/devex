import { Account } from "@tonclient/appkit";
import { signerKeys, TonClient } from "@tonclient/core";
import { libNode } from "@tonclient/lib-node";
import path from "path";
import * as fs from 'fs';
const IPFS = require('ipfs-core');
const fileTypeFromBuffer = require('file-type').fromBuffer
// const getResponse = require('ipfs-http-response');
import { everscale_settings } from "../config/everscale-settings";
import { globals } from "../config/globals";
import { nft_setting } from "../config/standart-nft-setting";

export type TokenInfo = {
  title: string,
  value: string,
  tag: string
}

const IMG_TYPES = ['png', 'jpg', 'jpeg', 'jpe', 'gif', 'svg', 'bmp', 'dib', 'rle', 'ico']
const VIDEO_TYPES = ['mp4', 'ogv', 'webm']

export class TokenInfoBuilder {
  private client: TonClient;

  constructor() {
    TonClient.useBinaryLibrary(libNode);

    this.client = new TonClient({
      network: {
        endpoints: [everscale_settings.ENDPOINTS]
      }
    });
  }

  destructor(): void {
    this.client.close();
  }

  async getTokenInfo(address: string): Promise<TokenInfo[]> {

    let tokenAccount = new Account({ abi: nft_setting.INFO_DATA_ABI }, {
      address: address,
      signer: undefined,
      client: this.client
    });
    let getInfo = await tokenAccount.runLocal("getInfoResponsible", { "_answer_id": 21 });
    let addrRoot = getInfo.decoded?.output.addrRoot

    let fullAbi = await JSON.parse(fs.readFileSync(path.resolve(globals.RESULT_COLLECTION, addrRoot.slice(2), "Data.abi.json")).toString());
    tokenAccount = new Account({ abi: fullAbi }, {
      address: address,
      signer: undefined,
      client: this.client
    });

    getInfo = await tokenAccount.runLocal("getInfo", {});

    let jsonCollection = await JSON.parse(fs.readFileSync(path.resolve(globals.RESULT_COLLECTION, addrRoot.slice(2), "collectionInfo.json")).toString());
    let output = getInfo.decoded?.output
    let respons: TokenInfo[] = await this.makeRespons(output, jsonCollection)

    console.log(output)

    return respons

  }

  private async makeRespons(output, jsonCollection): Promise<TokenInfo[]> {
    let respons: TokenInfo[] = []
    respons.push({ title: "Collection Address: ", value: output['addrRoot'], tag: 'p' })
    respons.push({ title: "Owner Address: ", value: output['addrOwner'], tag: 'p' })
    respons.push({ title: "Autor Address: ", value: output['addrAuthor'], tag: 'p' })
    respons.push({ title: "Token Address: ", value: output['addrData'], tag: 'p' })

    if (jsonCollection.collection.rarities.length != 0) {
      let value = Buffer.from(output['nftType'], 'hex').toString()
      respons.push({ title: "Token Type: ", value: value, tag: 'p' })
    }

    var ipfs = await IPFS.create()

    for (let parametr of jsonCollection.collection.parameters) {
      if (parametr.type == 'uint') {

        let value = Number(output['_' + parametr.name]).toString()
        respons.push({ title: parametr.name, value: value, tag: 'p' })

      } else if (parametr.type == 'string') {

        let value = Buffer.from(output['_' + parametr.name], 'hex').toString()
        let tag = 'p'

        if (value.match(/ipfs.io\/ipfs/g)) {
          try {
            let type = await this.getIpfsFileType(value, ipfs)
            if (IMG_TYPES.includes(type)) {
              tag = 'img'
            } else if (VIDEO_TYPES.includes(type)) {
              tag = 'video'
            } else {
              tag = 'a'
            }
          } catch (err) {
            console.log(`${value} Isn't mediafile`)
          }
        }

        respons.push({ title: parametr.name, value: value, tag: tag })
      }
    }

    ipfs.stop()

    for (let _enum of jsonCollection.enums) {
      console.log(_enum.enumVariants)
      console.log(output['_' + _enum.name])
      let value = _enum.enumVariants[Number(output['_' + _enum.name])]
      respons.push({ title: _enum.name, value: value, tag: 'p' })
    }

    return respons
  }

  private async getIpfsFileType(url, ipfs) {

    url = url.slice(url.search(/\/Qm/g) + 1)

    const stream = await ipfs.cat(url)

    for await (const chunk of stream) {
      return (await fileTypeFromBuffer(chunk))?.ext;
    }
  }


}