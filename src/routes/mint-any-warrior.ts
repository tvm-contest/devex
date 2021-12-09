const express = require('express');
const router = express.Router();

import { globals } from '../config/globals';
import { MintNftService } from '../services/mintNft.service';

export type TestTokenModel = {
    url: string,
    editionNumber: number,
    editionAmount: number,
    managersList: string[],
    royalty: number,

    power: number,
    tokenName: string,
    tokenRarity: string,
    image: number
}

router.get('/', async function (req, res, next) {
    try {
        let testToken: TestTokenModel = {
            url: "url",
            editionNumber: 2,
            editionAmount: 2,
            managersList: ['manager1'],
            royalty: 1,
        
            power: 34,
            tokenName: req.query.name,
            tokenRarity: req.query.rarity,
            image: 2
        }

        const mintService = new MintNftService(globals.RESULT_COLLECTION);
        await mintService.mintNft(testToken);

        res.send("MINTED!");
    } catch (error) {
        console.log(error);
    }
})

export { router as mintAnyRouter };