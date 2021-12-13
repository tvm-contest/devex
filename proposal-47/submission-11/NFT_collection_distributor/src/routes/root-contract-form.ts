import express from 'express';
import path from 'path';
import fs from 'fs'

import { globals } from '../config/globals';
import { Collection } from '../models/collection';
import { generateContract } from '../services/contract-generator.service';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { EnumParameter } from '../models/enum';
import { DeployDebotService } from '../services/deployDebot.service';
import { MediaFile } from '../models/mediafile';
import { JsonCollectionSevice } from '../services/json-collection.service';

const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/save-data', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);

    let tepmDir = fs.mkdtempSync(path.join(globals.RESULT_JSON, 'json-'));
    let jsonFileCollection = path.join(tepmDir, 'collection.json');

    fs.writeFileSync(jsonFileCollection, jsonCollection, {flag: 'w'});

    res.download(jsonFileCollection, () => {
        fs.rmSync(tepmDir, {recursive: true, force: true});
    });
});

router.post('/form-contracts', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let contractObjectCreator = new ContractObjectCreator()
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req)
    let contractDir = await generateContract(collection, jsonCollection, enums, mediafiles)

    res.render('success-page', { pageText: "Файлы сгенерированы в директорию: " + path.basename(contractDir) })
});

router.post('/deploy-contracts', async function(req, res, next) {
    let jsonCollectionService = new JsonCollectionSevice()
    let contractObjectCreator = new ContractObjectCreator()
    // Временный костыль, потом заменить нормально, статическая переменная (для рута) видимо не может быть пустой
    if (req.body.nameContract == '') {
        req.body.nameContract = 'name';
    }
    let jsonCollection = await jsonCollectionService.makeJsonCollection(req);
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req);
    let contractDir = await generateContract(collection, jsonCollection, enums, mediafiles);
    let deployTrueNftService = new DeployTrueNftService()
    let commissionAuthorGenerator = 0;
    if (req.body.checkCommissionAuthorGenerator == '') {
        commissionAuthorGenerator = req.body.commissionAuthorGenerator;
    }
    let rootAddress = await deployTrueNftService.deployTrueNft(contractDir, collection, commissionAuthorGenerator)
    contractDir = path.join(globals.RESULT_COLLECTION, rootAddress.slice(2))
    let deployDebotService = new DeployDebotService();
    let debotAddress = await deployDebotService.deployDebot(contractDir, rootAddress);
    
    res.redirect('/tokens-data-info?rootNftAddress=' + rootAddress)
});
  
router.post('/', async function(req, res, next) {

    // let contractObjectCreator = new ContractObjectCreator()
    // let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    // let contractDir = await generateContract(collection)

    // //Зачем коментирвать весь метод?
    // let deployTrueNftService = new DeployTrueNftService()
    // let address = await deployTrueNftService.deployTrueNft(contractDir, collection, 0)

    // // deleteContractDirTemp(collection)

    // res.send("Адрес коллекции: " + address)
    res.send("root")
    
});


export {router as rootContractForm};
