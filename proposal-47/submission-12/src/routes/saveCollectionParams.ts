import express from 'express';
import fs from 'fs'
import path from "path"

const router = express.Router();

router.post('/', function(req, res, next) {

    let collectionJson = req.body

    let collectionParams = JSON.stringify(collectionJson, null, '\t');
    
    let filename = "collectionParams.json";
    fs.writeFileSync(path.join("public", filename), collectionParams);
    res.json({ filename })
});

export {router as saveCollectionParams};