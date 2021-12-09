import express from 'express';
import fs from 'fs'

const router = express.Router();

router.get('/', function(req, res, next) {

    let collectionJson  = {
        collectionName: "MyFirstTokensCollection",
        nftTokens: [ 
            { 
                name: 'legend',
                limit: 5
            },
            { 
                name: 'usual',
                limit: 10000
            },
            { 
                name: 'squid',
                limit: 20
            }  
        ]
    };

    let collectionParams = JSON.stringify(collectionJson, null, '\t');
    
    let filename = "collectionParams.json";
    fs.writeFileSync(filename, collectionParams);
    res.download(filename, () => {
        fs.rmSync("", {recursive: true, force: true});
    });
    
});

export {router as saveCollectionParams};