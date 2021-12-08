import express from 'express';
import path from 'path';
import fs from 'fs'

import { globals } from '../config/globals';
import { Collection } from '../models/collection';
import { deleteContractDirTemp, generateContract } from '../services/contract-generator.service';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { EnumParameter } from '../models/enum';
import { DeployDebotService } from '../services/deployDebot.service';
import { MediaFile } from '../models/mediafile';

const router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/save-data', function(req, res, next) {
    let contractObjectCreator = new ContractObjectCreator();
    let collection = contractObjectCreator.makeRootContractObjectFromReq(req);

    let jsonCollection : string = JSON.stringify(collection, null, '\t');
    let tepmDir = fs.mkdtempSync(path.join(globals.TEMP_JSON, 'json-'));
    let jsonFileCollection = path.join(tepmDir, 'collection.json');

    fs.writeFileSync(jsonFileCollection, jsonCollection, {flag: 'w'});

    res.download(jsonFileCollection, () => {
        fs.rmSync(tepmDir, {recursive: true, force: true});
    });
});

router.post('/form-contracts', async function(req, res, next) {
    let contractObjectCreator = new ContractObjectCreator()
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req)
    let contractDir = await generateContract(collection, enums, mediafiles)

    res.render('success-page', { pageText: "Файлы сгенерированы в директорию: " + path.basename(contractDir) })
});

router.post('/deploy-contracts', async function(req, res, next) {
    let contractObjectCreator = new ContractObjectCreator()
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let enums : EnumParameter[] = contractObjectCreator.makeEnumsFromReq(req)
    let mediafiles : MediaFile[] = contractObjectCreator.makeMediaFilesFromReq(req);
    let contractDir = await generateContract(collection, enums, mediafiles)

    let deployTrueNftService = new DeployTrueNftService()
    let commissionAuthorGenerator = 0;
    if (req.body.checkCommissionAuthorGenerator == '') {
        commissionAuthorGenerator = req.body.commissionAuthorGenerator;
    }
    let address = await deployTrueNftService.deployTrueNft(contractDir, collection, commissionAuthorGenerator)
    let deployDebotService = new DeployDebotService();
    await deployDebotService.deployDebot(contractDir, address);

    res.render('success-page', { pageText: "Адрес коллекции: " + address })
});
  
router.post('/', async function(req, res, next) {

    // let rootContractForm : RootContractForm = {
    //     nameContract: req.body.nameContract,
    //     tokenLimit: req.body.tokenLimit,
    //     collections: [],
    //     parameters: []
    // }

    // //если был только один тип то в req будет строка, если несколько,то массив
    // if (typeof req.body.typeName === 'object') {
    //     for (let index = 0; index < req.body.typeName.length; index++) {
    //         let typeCollection : TypeCollection = {
    //             nameCollection: req.body.typeName[index],
    //             limitCollection: req.body.typeLimit[index],
    //         }
    //         rootContractForm.collections.push(typeCollection)    
    //     }
    // } else {
    //     let typeCollection : TypeCollection = {
    //         nameCollection: req.body.typeName,
    //         limitCollection: req.body.typeLimit,
    //     }
    //     rootContractForm.collections.push(typeCollection) 
    // }


    // if (typeof req.body.selectpicker === 'object') {
    //     for (let index = 0; index < req.body.selectpicker.length; index++) {
    //         if(req.body.selectpicker[index] === "2"){
    //             let paramCollection: ParamCollection = {
    //                 typeParam: "number",
    //                 MinLengthOrValue: req.body.minValue[index],
    //                 MaxLengthOrValue: req.body.maxValue[index],
    //             }
    //             rootContractForm.parameters.push(paramCollection)   
    //         } else if(req.body.selectpicker[index] === "3"){
    //             let paramCollection: ParamCollection = {
    //                 typeParam: "line",
    //                 MinLengthOrValue: req.body.minLength[index],
    //                 MaxLengthOrValue: req.body.maxLength[index],
    //             }
    //             rootContractForm.parameters.push(paramCollection)   
    //         }
    //     }
    // } else if(req.body.selectpicker === "2"){
    //     let paramCollection: ParamCollection = {
    //         typeParam: "number",
    //         MinLengthOrValue: req.body.minValue,
    //         MaxLengthOrValue: req.body.maxValue,
    //     }
    //     rootContractForm.parameters.push(paramCollection)   
    // } else if(req.body.selectpicker === "3"){
    //     let paramCollection: ParamCollection = {
    //         typeParam: "line",
    //         MinLengthOrValue: req.body.minLength,
    //         MaxLengthOrValue: req.body.maxLength,
    //     }
    //     rootContractForm.parameters.push(paramCollection)   
    // }
    // rootContractFormHandler(rootContractForm)
    // console.log(req.body)
    let contractObjectCreator = new ContractObjectCreator()
    let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    let contractDir = await generateContract(collection)

    //Зачем коментирвать весь метод?
    let deployTrueNftService = new DeployTrueNftService()
    let address = await deployTrueNftService.deployTrueNft(contractDir, collection, 0)

    // deleteContractDirTemp(collection)

    // res.send("Адрес коллекции: " + address)
    res.send("root")
    
});


export {router as rootContractForm};
