import express from 'express';
import { everscale_settings } from '../config/everscale-settings';

const router = express.Router();

import { TokensData } from "../services/tokesData.service";

router.get('/', async function(req, res, next) {
    if (req.query.rootNftAddress){
        const tokensDataInfo = new TokensData();
        let tokensData = await tokensDataInfo.getTokensData(req.query.rootNftAddress.toString());
        let rootNftInfo = await tokensDataInfo.getRootNftInfo(req.query.rootNftAddress.toString());
        let debotAddress = await tokensDataInfo.getDebotAddress(req.query.rootNftAddress.toString());
        let net;
        if (everscale_settings.ENDPOINTS == "http://main.ton.dev") {
            net = 'mainnet'
        } else if (everscale_settings.ENDPOINTS == "http://net.ton.dev") {
            net = 'devnet'
        } else {
            net = 'net' //для локальной сети вроде нет адреса
        }
        let tonSurfDebot = `https://web.ton.surf/debot?address=${debotAddress}&net=${net}`
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