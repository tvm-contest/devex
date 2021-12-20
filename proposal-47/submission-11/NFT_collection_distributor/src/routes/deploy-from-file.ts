import express from 'express';
import path from 'path';
import fs from 'fs';

import { UploadedFile } from 'express-fileupload';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { generateContract } from '../services/contract-generator.service';
import { Collection } from '../models/collection';
import { EnumParameter } from '../models/enum';
import { DeployDebotService } from '../services/deployDebot.service';
import { globals } from '../config/globals';
import { MediaFile } from '../models/mediafile';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DirectSaleService } from '../services/directSale.service';
import { everscale_settings } from '../config/everscale-settings';

const router = express.Router();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('deploy-from-file');
});

router.post('/', async function (req, res, next) {

  // req.files.photo.mv('public/pics/'+req.files.photo.name);

  let jsonFilePath = "req.files?.jsonCollection"
  const file = req.files?.jsonCollection as UploadedFile
  let jsonCollection = await JSON.parse((file.data.toString()).toString());
  let contractObjectCreator = new ContractObjectCreator()
  let collection: Collection = contractObjectCreator.makeRootContractObjectFromJson(jsonCollection.collection)
  let enums: EnumParameter[] = contractObjectCreator.makeEnumsFromJson(jsonCollection.enums)
  let mediafiles: MediaFile[] = contractObjectCreator.makeMediaFilesFromJson(jsonCollection.mediafiles);

  let deployTrueNftService = new DeployTrueNftService();
  let commissionAuthorGenerator = 0;
  if (jsonCollection.commissions.commissionAuthorGenerator.check) {
    commissionAuthorGenerator = jsonCollection.commissions.commissionAuthorGenerator.value;
  }
  let commissionFavorOwner = 0;
  if (jsonCollection.commissions.commissionFavorOwner.check) {
    commissionAuthorGenerator = jsonCollection.commissions.commissionFavorOwner.value;
  }

  let mintingPriceUsers = Number(jsonCollection.commissions.mintingPriceUsers);

  let contractDir = await generateContract(collection, JSON.stringify(jsonCollection, null, '\t'), enums, mediafiles, mintingPriceUsers)

  let address = await deployTrueNftService.deployTrueNft(contractDir, collection, mintingPriceUsers, commissionFavorOwner)
  contractDir = path.join(globals.RESULT_COLLECTION, address.slice(2))
  if (!fs.existsSync(contractDir)) {
    const directSaleService = new DirectSaleService();
    let addrRoyaltyAgent = everscale_settings.ADDRESS_ROYALTY_AGENT;
    let royaltyPercent = everscale_settings.ROYALTY_PERCENT;
    let directSaleRootAddr = await directSaleService.deployDirectSaleRoot(address.slice(2), addrRoyaltyAgent, royaltyPercent);
    console.log("DirectSaleRoot address: " + directSaleRootAddr);
    let deployDebotService = new DeployDebotService();
    let initDataForMintingDebot = {
        _addrNFTRoot: address
    };
    let mintingDebotAddress = await deployDebotService.deployDebot(contractDir, "MintingDebot", initDataForMintingDebot);
    let initDataForSellingDebot = {
        _addrDirectSaleRoot: directSaleRootAddr
    };
    let sellingDebotAddress = await deployDebotService.deployDebot(contractDir, "SellingDebot", initDataForSellingDebot);
    let tokenPurchaseDebot = await deployDebotService.deployDebot(contractDir, "TokenPurchaseDebot");
  }

  res.render('demo-mint', {
    rootAddress: address,
    collectionName: jsonCollection.collection.name,
    tokenParams: jsonCollection.collection.parameters,
    rarities: jsonCollection.collection.rarities,
    enums: jsonCollection.enums
  });
});

export { router as deployFromFile };