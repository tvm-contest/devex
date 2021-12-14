import express from 'express';
import { globals } from '../config/globals'
import path from 'path'
import fs from 'fs'
import { MintNftService } from '../services/minting-token.service';

const router = express.Router();

router.post('/', async function (req, res, next) {
    console.log(req.body.colName, req.body.colAdd)
    const collectionRootAddress = req.body.colAdd;
    const collectionName = req.body.colName;
    const jsonFilePath = path.join(globals.RESULT_COLLECTION, `${req.body.colAdd}`.substring(2), "collectionInfo.json");

    const data = fs.readFileSync(jsonFilePath)
    const objJson = data.toString()
    res.render('minting-token', {
        FileJson: objJson,
        collectionRootAddress,
        collectionName
    });
});

router.post('/minting', async function (req, res, next) {
    try {
        console.log("BODY IS ", req.body);
        const mintService = new MintNftService(req.body.rootAddress);
        await mintService.mintNft(req.body);
    } catch (error) {
        console.log(error);
    }
    
    res.redirect('/tokens-data-info?rootNftAddress=' + req.body.rootAddress);
})

export { router as MintingTokens };