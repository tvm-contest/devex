import express from 'express';
const router = express.Router();

import { generateContract, getTempDir } from "../services/contract-generator.service";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";
import { DeployTrueNftService } from "../services/deployTrueNft.service"

/* GET home page. */
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});

router.post('/', async function(req, res, next) {
    let descriptCollection = getDescriptCollection(
        req.body.nameContract, 
        req.body.tokenLimit
    );
    let rarities = getRarities(
        req.body.type, 

    );
    let parameters = getParameters(
        req.body.selectpicker,
        req.body.parameter
    );
    let collectionSettings = new Collection(descriptCollection, rarities, parameters);
    await generateContract(collectionSettings);
    let deployTrueNftService = new DeployTrueNftService();
    await deployTrueNftService.deployTrueNft(getTempDir(collectionSettings), collectionSettings);
});

function getDescriptCollection(nameToken, tokenLimit) : DescriptCollection {
    return new DescriptCollection(
        nameToken, 
        tokenLimit
    );
}

function getRarities(type) : Rarity[] {
    let rarities = new Array<Rarity>();
    for (let index = 0; index < type.length; index++) {
        let rarity = new Rarity(
            type[index].name, 
            type[index].limit
        );
        rarities.push(rarity);
    }
    return rarities.reverse();
}

function getParameters(selectpicker, parameter) : Parametr[] {
    let parameters = new Array<Parametr>();

    if (typeof selectpicker === 'object') {
        for (let i = 0; i < selectpicker.length; i++) {
            let name;
            let type;
            let minValue;
            let maxValue;
            if (selectpicker[i] === "line") {
                name = "line" + i;
                type = "string";
                minValue = parameter[i].line.min;
                maxValue = parameter[i].line.max;
            } else {
                name = "number" + i;
                type = "uint";
                minValue = parameter[i].number.min;
                maxValue = parameter[i].number.max;
            }
            let parametr = new Parametr(name, type, minValue, maxValue)
            parameters.push(parametr);
        }
    } else {
        let name;
        let type;
        let minValue;
        let maxValue;
        if (selectpicker === "line") {
            name = "line";
            type = "string";
            minValue = parameter[0].line.min;
            maxValue = parameter[0].line.max;
        } else {
            name = "number";
            type = "uint";
            minValue = parameter[0].number.min;
            maxValue = parameter[0].number.max;
        }
        let parametr = new Parametr(name, type, minValue, maxValue);
        parameters.push(parametr);
    }
    
    return parameters.reverse();
}

export {router as newRootContractForm};