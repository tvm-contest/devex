import express from 'express';
import path from 'path';

import { UploadedFile } from 'express-fileupload';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { generateContract } from '../services/contract-generator.service';
import { Collection } from '../models/collection';
import { EnumParameter } from '../models/enum';
import { DeployDebotService } from '../services/deployDebot.service';
import { globals } from '../config/globals';
import { MediaFile } from '../models/mediafile';
import { ContractObjectCreator } from '../services/contract-object-creator.service';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('deploy-from-file');
});

router.post('/', async function(req, res, next) {

  // req.files.photo.mv('public/pics/'+req.files.photo.name);
  let jsonFilePath = "req.files?.jsonCollection"
  const file = req.files?.jsonCollection as UploadedFile
  let jsonCollection = await JSON.parse((file.data.toString()).toString());
  let contractObjectCreator = new ContractObjectCreator()
  let collection : Collection = contractObjectCreator.makeRootContractObjectFromJson(jsonCollection.collection)
  let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromJson(jsonCollection.enums)
  let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromJson(jsonCollection.mediafiles);

  let contractDir = await generateContract(collection, enums, mediafiles)

  let deployTrueNftService = new DeployTrueNftService()
  let commissionAuthorGenerator = 0;
  if (jsonCollection.commissions.commissionAuthorGenerator.check) {
      commissionAuthorGenerator = jsonCollection.commissions.commissionAuthorGenerator.value;
  }
  
  let address = await deployTrueNftService.deployTrueNft(contractDir, collection, commissionAuthorGenerator)
  contractDir = path.join(globals.RESULT_COLLECTION, address.slice(2))
  let deployDebotService = new DeployDebotService();
  await deployDebotService.deployDebot(contractDir, address);
  
  res.redirect('/tokens-data-info?rootNftAddress=' + address)

});

export {router as deployFromFile};