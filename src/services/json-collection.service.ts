import { Collection } from "../models/collection"
import { EnumParameter } from "../models/enum"
import { MediaFile } from "../models/mediafile"
import { ContractObjectCreator } from "./contract-object-creator.service"

type Commissions = {
  commissionAuthor: { check: boolean, value: number },
  commissionFavorOwner: { check: boolean, value: number },
  commissionAuthorGenerator: { check: boolean, value: number },
  mintingPriceUsers: number
}

type JsonCollection = {
  collection : Collection,
  enums : EnumParameter[],
  mediafiles : MediaFile[],
  commissions : Commissions
}

export class JsonCollectionSevice {

  async makeJsonCollection(req) : Promise<string> {
    let contractObjectCreator = new ContractObjectCreator()
    let jsonCollection : JsonCollection;
    let commissions : Commissions = {
      commissionAuthor : { check: false, value: 0 },
      commissionFavorOwner : { check: false, value: 0 },
      commissionAuthorGenerator : { check: false, value: 0 },
      mintingPriceUsers: Number(req.body.MintingPriceUsers)
    }
    
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req)

    if (req.body.checkUseAuthor == '') {
      commissions.commissionAuthor.check = true;
      commissions.commissionAuthor.value = Number(req.body.commissionAuthorGenerator);
    }
    if (req.body.checkCommissionFavorOwner == '') {
      commissions.commissionFavorOwner.check = true;
      commissions.commissionFavorOwner.value = Number(req.body.commissionFavorOwner);
    }
    if (req.body.checkCommissionAuthorGenerator == '') {
      commissions.commissionAuthorGenerator.check = true;
      commissions.commissionAuthorGenerator.value = Number(req.body.commissionAuthorGenerator);
    }

    jsonCollection = {
      collection : collection,
      enums : enums,
      mediafiles : mediafiles,
      commissions : commissions
    }

    return JSON.stringify(jsonCollection, null, '\t');
  }
}