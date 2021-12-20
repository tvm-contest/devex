import express from 'express';
import path from 'path';

import { MintNftService } from '../services/minting-token.service';
import { TokenImageCreator } from '../services/gen-demo-image.service';
import { globals } from '../config/globals';

const router = express.Router();

function getRandomShield(min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

/* GET home page. */
router.post('/', async function (req, res, next) {
    const DEMO_COLLECTION_IMAGES_PATH = path.resolve(globals.RESULT_COLLECTION, req.body.rootAddress.substring(2));
    const DEMO_MINTED_TOKENS = 5;
    const imageCreator = new TokenImageCreator();

    try {
        for (let tokenItem = 0; tokenItem < DEMO_MINTED_TOKENS; tokenItem++) {
            const mintService = new MintNftService(req.body.rootAddress);
            await mintService.mintNft({
                body:
                {
                    // It's as req.body
                    contractName: 'DemoWarriorTokens',
                    rarities: "rarity",
                    token_name: "token_demo_name",
                    warrior_shield: getRandomShield(1, 100),
                    warrior_arm: 0
                }
            });
            await imageCreator.createTokenImage(DEMO_COLLECTION_IMAGES_PATH);
        }
    } catch (error) {
        console.log(error);
    }

    res.redirect('/tokens-data-info?rootNftAddress=' + req.body.rootAddress);
});

export { router as demoMinting };