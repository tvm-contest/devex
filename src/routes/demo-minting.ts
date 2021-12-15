import express from 'express';

import { MintNftService } from '../services/minting-token.service';

const router = express.Router();
const DEMO_MINTED_TOKENS = 5;

function getRandomShield(min: number, max: number) {
    let rand = min - 0.5 + Math.random() * (max - min + 1);
    return Math.round(rand);
}

/* GET home page. */
router.post('/', async function (req, res, next) {
    try {
        for (let tokenItem = 0; tokenItem < DEMO_MINTED_TOKENS; tokenItem++) {
            const mintService = new MintNftService(req.body.rootAddress);
            await mintService.mintNft({
                // It's as req.body
                contractName: 'DemoWarriors',
                rarities: "rarity",
                parameters: {
                    // shield for different tokens
                    shield: getRandomShield(1, 100),
                    warrior_name: "token_demo_name",
                    enum: {
                        arm: 0
                    }
                }
            });
        }
    } catch (error) {
        console.log(error);
    }

    // res.redirect('/tokens-data-info?rootNftAddress=' + req.body.rootAddress);
});

export { router as demoMinting };