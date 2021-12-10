import { Account } from "@tonclient/appkit";
import { signerKeys, TonClient } from "@tonclient/core";
import { libNode } from "@tonclient/lib-node";
import { everscale_settings } from "../config/everscale-settings";
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

  async getTokenInfo(address: string) : Promise<TokenInfo>{

    let tokenAccount = new Account( { abi: nft_setting.INFO_DATA_ABI } , {
      address: address,
      signer: signerKeys(everscale_settings.KEYS),
      client: this.client
    });
    console.log(address)
    let getInfo = await tokenAccount.runLocal("getInfo", {});
    
    let tokenInfo : TokenInfo = {
      addrData : getInfo.decoded?.output.addrData,
      addrRoot : getInfo.decoded?.output.addrRoot,
      addrOwner : getInfo.decoded?.output.addrOwner,
      addrTrusted : getInfo.decoded?.output.addrTrusted,
      color : getInfo.decoded?.output.color
    }

    return tokenInfo

  }

  
}