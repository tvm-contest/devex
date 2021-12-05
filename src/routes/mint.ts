const express = require('express');
const router = express.Router();

import { globals } from '../config/globals';
import { MintNftService } from '../services/mintNft.service';

export type TestTokenModel = {
    tokenName: string,
    tokenRarity: string,
    image: number
}

router.get('/', async function (req, res, next) {
    try {
        let testToken: TestTokenModel = {
            tokenName: req.query.name,
            tokenRarity: req.query.rarity,
            image: 2
        }

        const mintService = new MintNftService(globals.CONTRACTS_ROOT);
        await mintService.mintNft(testToken);

        res.send("MINTED!");
    } catch (error) {
        console.log(error);
    }
})

export { router as mintRouter };