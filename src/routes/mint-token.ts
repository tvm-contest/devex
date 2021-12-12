const express = require('express');
const router = express.Router();

import { globals } from '../config/globals';
import { MintNftService } from '../services/minting-token.service';

router.get('/', async function (req, res, next) {
    try {
        const mintService = new MintNftService(globals.RESULT_COLLECTION);
        // await mintService.mintNft();

        res.render("mint-token-page");
    } catch (error) {
        console.log(error);
    }
})

export { router as mintTokenRouter };