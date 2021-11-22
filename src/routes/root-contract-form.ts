import express from 'express';
const router = express.Router();

import { RootContractForm } from "../services/root-contract-form-handler.sevice"
import { TypeCollection } from "../services/root-contract-form-handler.sevice"
import { rootContractFormHandler } from "../services/root-contract-form-handler.sevice"

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/', function(req, res, next) {

    let rootContractForm : RootContractForm = {
        nameContract: req.body.nameContract,
        tokenLimit: req.body.tokenLimit,
        collections: []
    }

    //если был только один тип то в req будет строка, если несколько,то массив
    if (typeof req.body.typeName === 'object') {
        for (let index = 0; index < req.body.typeName.length; index++) {
            let typeCollection : TypeCollection = {
                nameCollection: req.body.typeName[index],
                limitCollection: req.body.typeLimit[index],
            }
            rootContractForm.collections.push(typeCollection)    
        }
    } else {
        let typeCollection : TypeCollection = {
            nameCollection: req.body.typeName,
            limitCollection: req.body.typeLimit,
        }
        rootContractForm.collections.push(typeCollection) 
    }

    rootContractFormHandler(rootContractForm)
    res.send("форма получена")
});


export {router as rootContractForm};
