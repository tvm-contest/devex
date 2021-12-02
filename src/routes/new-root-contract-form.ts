import express from 'express';
const router = express.Router();

import { generateContract, getTempDir } from "../services/contract-generator.service";
import { Collection } from "../models/collection";
import { DescriptCollection } from "../models/descript-collection";
import { Parametr } from "../models/parametr";
import { Rarity } from "../models/rarity";
import { DeployTrueNftService } from "../services/deployTrueNft.service"

/* GET home page. */
/*
router.get('/', function(req, res, next) {
    res.render('root-contract-form');
});
*/

router.get('/', async function(req, res, next) {
    let params : Parametr[] = [new Parametr("param1", "int", 1), new Parametr("param2", "int", 23)];
    let rariry : Rarity[] = [new Rarity("rare", 10), new Rarity("norare", 90)];
    let description : DescriptCollection = new DescriptCollection("Collect1", 100);
    let collection : Collection = new Collection(description, rariry, params);
    await generateContract(collection);
    let deployTrueNftService = new DeployTrueNftService();
    await deployTrueNftService.deployTrueNft(getTempDir(collection), params);
});

/*
необходимые данные из формы:
    DescriptionCollection:
        - descriptCollectionName
        - descriptCollectionLimit
    Rarities (для этих параметров в форме может быть как одно окно ввода, так и несколько):
        - rarityName
        - rarityLimit
    Parameters (для этих параметров в форме может быть как одно окно ввода, так и несколько):
        - parametrName
        - parametrType
        - parametrValue
*/

/*
router.post('/', function(req, res, next) {
    let descriptCollection = getDescriptCollection(
        req.body.descriptCollectionName, 
        req.body.descriptCollectionLimit
    );
    let rarities = getRarities(
        req.body.rarityName, 
        req.body.rarityLimit
    );
    let parameters = getParameters(
        req.body.parametrName,
        req.body.parametrType,
        req.body.parametrValue
    );
    let collectionSettings = new Collection(descriptCollection, rarities, parameters);
    await generateContract(collectionSettings);
    let deployTrueNftService = new DeployTrueNftService();
    await deployTrueNftService.deployTrueNft(createTempDir(collectionSettings), parameters);
});
*/

function getDescriptCollection(descriptCollectionName, descriptCollectionLimit) : DescriptCollection {
    return new DescriptCollection(
        descriptCollectionName, 
        descriptCollectionLimit
    );
}

function getRarities(rarityName, rarityLimit) : Rarity[] {
    let rarities = new Array<Rarity>();
    if (typeof rarityName === 'object') {
        for (let index = 0; index < rarityName.length; index++) {
            let rarity = new Rarity(
                rarityName[index], 
                rarityLimit[index]
            );
            rarities.push(rarity);
        }
    } else {
        let rarity = new Rarity(rarityName, rarityLimit);
        rarities.push(rarity);
    }
    return rarities.reverse();
}

function getParameters(parametrName, parametrType, parametrValue) : Parametr[] {
    let parameters = new Array<Parametr>();
    if (typeof parametrName === 'object') {
        for (let index = 0; index < parametrName.length; index++) {
            let parametr = new Parametr(
                parametrName[index],
                parametrType[index],
                parametrValue[index]
            )
            parameters.push(parametr);
        }
    } else {
        let parametr = new Parametr(
            parametrName,
            parametrType,
            parametrValue
        )
        parameters.push(parametr);
    }
    return parameters.reverse();
}

export {router as newRootContractForm};