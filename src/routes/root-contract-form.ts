import express from 'express';
import path from 'path';
import { globals } from '../config/globals';
import { Collection } from '../models/collection';
import { deleteContractDirTemp, generateContract } from '../services/contract-generator.service';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
const router = express.Router();


router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/', async function(req, res, next) {

  let contractObjectCreator = new ContractObjectCreator()
  let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
  let contractDir = await generateContract(collection)

  let deployTrueNftService = new DeployTrueNftService()
  let address = await deployTrueNftService.deployTrueNft(contractDir)

  deleteContractDirTemp(collection)

  res.send("Адрес коллекции: " + address)
});


export {router as rootContractForm};
