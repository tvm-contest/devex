import { Account } from '@tonclient/appkit';
import { signerKeys, TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
import fs from 'fs'
import path from 'path';
import { everscale_settings } from '../config/everscale-settings';
import { globals } from '../config/globals';
import { Collection } from "../models/collection";

export type CollectionInfo = {
  name : string
  address : string
  icon : string
}

export class CollectionListService {
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

  async getCollectionList() : Promise<CollectionInfo[]> {
    let collectionsInfo : CollectionInfo[] = []
     
    let collectionDirList = fs.readdirSync(globals.TEMP_COLLECTION, {withFileTypes: true}).filter((fileOrDir) => {
      return fileOrDir.isDirectory()
    })

    for (const collectionDir of collectionDirList) {
      let collectionAccount = await this.getCollectionAccount(collectionDir.name);
      try{
        let collectionIcon = (await collectionAccount.runLocal("getIcon", {})).decoded?.output.icon;
      } catch(err){
        console.log(err)
      }
      
      let collectionIcon = (await collectionAccount.runLocal("getIcon", {})).decoded?.output.icon;
      let collectionName = (await collectionAccount.runLocal("getName", {})).decoded?.output.name;
      collectionName = Buffer.from(collectionName, 'hex').toString()
      let oneCollectionInfo : CollectionInfo = {
        name: collectionName,
        address: await collectionAccount.getAddress(),
        icon: collectionIcon
      }
      collectionsInfo.push(oneCollectionInfo)
    }

    return collectionsInfo
  }

  private async getCollectionAccount(tempCollectionDir : string) : Promise<Account> {
    let abi = await JSON.parse(fs.readFileSync(path.join(globals.TEMP_COLLECTION, tempCollectionDir, 'NftRoot.abi.json')).toString());
    let tvc = fs.readFileSync(path.join(globals.TEMP_COLLECTION, tempCollectionDir, 'NftRoot.tvc'), {encoding: 'base64'});
    const collectionAccount = new Account({
      abi: abi,
      tvc: tvc
    }, {
      signer: signerKeys(everscale_settings.KEYS),
      initData: {},
      client: this.client
    });
    return collectionAccount;
  }

}