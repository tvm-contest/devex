import express from 'express';
import fs from 'fs'
import path from 'path';

import { globals } from '../config/globals';
import { Collection } from '../models/collection';
import { DescriptCollection } from '../models/descript-collection';
import { Parametr } from '../models/parametr';
import { Rarity } from '../models/rarity';
import { Token } from '../models/token';

const router = express.Router();

router.get('/', function(req, res, next) {
    
    let params : Parametr[] = [new Parametr("param1", "uint"), new Parametr("param2", "string")];
    let rariry : Rarity[] = [new Rarity("rare", 10), new Rarity("norare", 90)];
    let description : DescriptCollection = new DescriptCollection("Collect1", 100);
    let collection : Collection = new Collection(description, rariry, params);
    let jsonCollection : string = JSON.stringify(collection, null, '\t');

    let tokenParams : Parametr[] = [new Parametr("param1", "uint", 31), new Parametr("param2", "string", "valueForParam")];
    let token : Token = new Token(collection, tokenParams, rariry[0]);
    let jsonToken : string = JSON.stringify(token, null, '\t');

    let tepmDir = fs.mkdtempSync(path.join(globals.TEMP_JSON, 'json-'));
    let jsonFileCollection = path.join(tepmDir, 'collection.json');
    let jsonFileToken = path.join(tepmDir, 'token.json');

    fs.writeFileSync(jsonFileCollection, jsonCollection, {flag: 'w'});
    fs.writeFileSync(jsonFileToken, jsonToken, {flag: 'a'});

    // res.download(jsonFileCollection, () => {
    //     fs.rmSync(tepmDir, {recursive: true, force: true});
    // });
    res.download(jsonFileToken, () => {
        fs.rmSync(tepmDir, {recursive: true, force: true});
    });

});

export {router as saveJsonRouter};
