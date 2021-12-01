import express from 'express';
const router = express.Router();

import { TokensData } from "../services/tokesData.service";

router.get('/', function(req, res, next) {
    res.render('getRootForGetTokensData');
});

router.post('/', async function(req, res, next) {
    const tokensDataInfo = new TokensData();
    let tokensData = await tokensDataInfo.getTokensData(req.body.rootNftAddress);
    res.render('tokens-data-info', {
        rootAddress: req.body.rootNftAddress,
        tokensData: tokensData
    });
});

export {router as tokensDataInfo};