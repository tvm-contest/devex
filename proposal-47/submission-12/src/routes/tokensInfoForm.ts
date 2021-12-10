import express from 'express';
const router = express.Router();
import { RarityType } from "../models/rarity-model"; 


type TokensInfoForm = {
    collectionName: string
    nftTokens: RarityType[]
} 

router.get('/', function(req, res, next) {
    res.render('tokensInfoForm');
});

router.post('/', function(req, res, next) {

    let tokensInfoForm : TokensInfoForm = {
        collectionName: req.body.collectionName,
        nftTokens: []
    }
    if (typeof req.body.tokenName != 'object') {
        tokensInfoForm.nftTokens.push( {
        rarityName: req.body.tokenName,
        amount: req.body.tokenLimit} ) 
    }
    else
    for (let i = 0; i < req.body.tokenName.length; i++) {
            tokensInfoForm.nftTokens.push({
                rarityName: req.body.tokenName[i],
                amount: req.body.tokenLimit[i]
            })    
    }
    delete req.body
    res.render('tokensInfoForm', { title: 'Success' });  
});


export {router as tokensInfoForm};
