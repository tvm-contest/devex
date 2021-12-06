import express from 'express';
const router = express.Router();

import { TokensData } from "../services/tokesData.service";

router.get('/', async function(req, res, next) {
    if (req.query.rootNftAddress){
        const tokensDataInfo = new TokensData();
        let tokensData = await tokensDataInfo.getTokensData(req.query.rootNftAddress.toString());
        let rootNftInfo = await tokensDataInfo.getRootNftInfo(req.query.rootNftAddress.toString());
        let debotAddress = "TODO";
        let tonSurfDebot = "TODO";
        res.render('tokens-data-info', {
            rootAddress: req.query.rootNftAddress,
            rootNftName: rootNftInfo.name,
            tokensData: tokensData,
            debotAddress: debotAddress,
            tonSurfDebot: tonSurfDebot
        });
    } else {
        res.render('getRootForGetTokensData');
    }
});

router.post('/', async function(req, res, next) {

});

export {router as tokensDataInfo};