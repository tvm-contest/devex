import express from 'express';
import { globals } from '../config/globals'
import path from 'path'
import fs from 'fs'
import { MintNftService } from '../services/minting-token.service';
import { error_codes } from '../config/error_codes';

const router = express.Router();
//const multipartMiddleware = multipart()
//router.use(multipart())

router.post('/', async function (req, res, next) {
    const collectionRootAddress = req.body.colAdd ? req.body.colAdd : req.body.rootAddress;
    const collectionName = req.body.colName ? req.body.colName : req.body.contractName;
    const jsonFilePath = path.join(globals.RESULT_COLLECTION, `${collectionRootAddress}`.substring(2), "collectionInfo.json");
    const data = fs.readFileSync(jsonFilePath)
    const objJson = data.toString()
    res.render('minting-token', {
        FileJson: objJson,
        collectionRootAddress,
        collectionName,
        error: req.query.error
    });
});

router.post('/minting', async function (req, res, next) {
    try {
        const mintService = new MintNftService(req.body.rootAddress);
        await mintService.mintNft(req);
        res.redirect('/tokens-data-info?rootNftAddress=' + req.body.rootAddress);
    } catch (error: any){
        console.log(error)
        switch (error.code) {
            case(error_codes.INVALID_PHRASE): res.redirect(307, '/minting-tokens?error=invalidPhrase'); break;
            case(error_codes.INVALID_ADDRESS): res.redirect(307, '/minting-tokens?error=invalidAddress'); break;
            case(error_codes.ACCOUNT_NOT_EXIST): res.redirect(307, '/minting-tokens?error=accountError'); break;
        }
    }
})

export { router as MintingTokens };