import express from 'express';
import fs from 'fs'
import path from 'path';

import { globals } from '../config/globals';

const router = express.Router();

router.get('/', function(req, res, next) {
    //Создаю объект с вложенностью и массивом, чтобы быть уверенным 
    //что со сложными объектами тоже будет работать
    let exapmpleObject  = {
        name: 'exampleName',
        description: 'exampleDescription',
        collection: [
            {
                innerName: 'exampleInnerName1',
                innerDescription: 'exampleInnerDescription1'
            },
            {
                innerName: 'exampleInnerName2',
                innerDescription: 'exampleInnerDescription2'
            },
        ],
        user: {
            userName: 'exampleUserName',
            userDescription: 'exampleUserDescription'
        }
    };

    let jsonString : string = JSON.stringify(exapmpleObject, null, '\t');
    
    let tepmDir = fs.mkdtempSync(path.join(globals.TEMP_ROOT, 'json-'));
    let jsonFile = path.join(tepmDir, 'object.json');

    fs.writeFileSync(jsonFile, jsonString);

    res.download(jsonFile, () => {
        fs.rmSync(tepmDir, {recursive: true, force: true});
    });
    
});

export {router as saveJsonRouter};
