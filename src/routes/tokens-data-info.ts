import express from 'express';
import { everscale_settings } from '../config/everscale-settings';
import { globals } from '../config/globals';
import fs from 'fs';
import path from 'path';

const router = express.Router();

import { TokensData } from "../services/tokesData.service";
import { Account } from '@tonclient/appkit';

router.get('/', async function(req, res, next) {
    if (req.query.rootNftAddress){
        const tokensDataInfo = new TokensData();
        let tokensData = await tokensDataInfo.getTokensData(req.query.rootNftAddress.toString());
        let rootNftInfo = await tokensDataInfo.getRootNftInfo(req.query.rootNftAddress.toString());

        let initDataMintingDebot = {
            _addrNFTRoot: req.query.rootNftAddress
        };
        let mintingDebotAddress = await tokensDataInfo.getDebotAddress(req.query.rootNftAddress.toString(), "MintingDebot", initDataMintingDebot);
        
        let directSaleRootAddr = await tokensDataInfo.getContractAddress(req.query.rootNftAddress.toString(), "DirectSaleRoot");
        let initDataSellingDebot = {
            _addrDirectSaleRoot: directSaleRootAddr
        }
        let sellingDebotAddress = await tokensDataInfo.getDebotAddress(req.query.rootNftAddress.toString(), "SellingDebot", initDataSellingDebot);
        
        let tokenPurchaseDebotAddrress = await tokensDataInfo.getDebotAddress(req.query.rootNftAddress.toString(), "TokenPurchaseDebot");
        
        let net;
        if (everscale_settings.ENDPOINTS.endsWith("main.ton.dev")) {
            net = 'mainnet'
        } else if (everscale_settings.ENDPOINTS.endsWith("net.ton.dev")) {
            net = 'devnet'
        } else {
            net = 'net' //для локальной сети вроде нет адреса
        }
        let tonSurfMintingDebot = `https://web.ton.surf/debot?address=${mintingDebotAddress}&net=${net}`
        let tonSurfSellingDebot = `https://web.ton.surf/debot?address=${sellingDebotAddress}&net=${net}`
        let tonSurfTokenPurchaseDebot = `https://web.ton.surf/debot?address=${tokenPurchaseDebotAddrress}&net=${net}`
        res.render('tokens-data-info', {
            rootAddress: req.query.rootNftAddress,
            rootNftName: rootNftInfo.name,
            tokensData: tokensData,
            mintingDebotAddress: mintingDebotAddress,
            sellingDebotAddress: sellingDebotAddress,
            tokenPurchaseDebotAddrress: tokenPurchaseDebotAddrress,

            tonSurfMintingDebot: tonSurfMintingDebot,
            tonSurfSellingDebot: tonSurfSellingDebot,
            tonSurfTokenPurchaseDebot: tonSurfTokenPurchaseDebot
        });
    } else {
        res.render('getRootForGetTokensData');
    }
});

router.post('/', async function(req, res, next) {

});

export {router as tokensDataInfo};
