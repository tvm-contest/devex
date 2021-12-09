import { TokenInfoGetter } from "../services/get-token-info.service";

const express = require('express');
const router = express.Router();

router.get('/', async function(req, res) {
    try {
        const tokenAddress = req.query.id;
        const tokenInfoGetter = new TokenInfoGetter();
        const tokenInfoPromise = await tokenInfoGetter.getTokenInfo(tokenAddress);

        res.render('token-info', {
            root: tokenInfoPromise.data._addrRoot,
            owner: tokenInfoPromise.data._addrOwner,
            rarity: tokenInfoPromise.data._rarityType
        });
    } catch(err) {
        console.error(`GET_DATA_ACCOUNT_ERROR ${err}`);
    }
});

export { router as tokenInfoRouter };