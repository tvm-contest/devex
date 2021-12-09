import { TokenInfoGetter } from "../services/get-token-info.service";

const express = require('express');
const router = express.Router();

router.get('/', async function(req, res) {
    try {
        const tokenAddress = req.query.id;
        const tokenInfoGetter = new TokenInfoGetter();
        const tokenInfoPromise = await tokenInfoGetter.getTokenInfo("0:dcdd0ae6a6c4e840b90879be5795b3076134152936149165e1493af8b115ebae");

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