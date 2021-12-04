import express from 'express';
import path from 'path';
import { globals } from '../config/globals';
import { Collection } from '../models/collection';
import { deleteContractDirTemp, generateContract } from '../services/contract-generator.service';
import { ContractObjectCreator } from '../services/contract-object-creator.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
const router = express.Router();

import { RootContractForm } from "../services/root-contract-form-handler.sevice"
import { TypeCollection } from "../services/root-contract-form-handler.sevice"
import { rootContractFormHandler } from "../services/root-contract-form-handler.sevice"
import { ParamCollection } from "../services/root-contract-form-handler.sevice"

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});
router.post('/save-data', function(req, res, next) {
    console.log(req.body)
    res.send("save-data")
});
router.post('/form-contracts', function(req, res, next) {
    console.log(req.body)
    res.send("form-contracts")
});
router.post('/deploy-contracts', function(req, res, next) {
    console.log(req.body)
    res.send("deploy-contracts")
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
    // let contractObjectCreator = new ContractObjectCreator()
    // let collection : Collection = contractObjectCreator.makeRootContractObjectFromReq(req)
    // let contractDir = await generateContract(collection)

    // let deployTrueNftService = new DeployTrueNftService()
    // let address = await deployTrueNftService.deployTrueNft(contractDir, collection.getParameters())

    // deleteContractDirTemp(collection)

    // res.send("Адрес коллекции: " + address)
    res.send("root")
    
});


export {router as rootContractForm};
