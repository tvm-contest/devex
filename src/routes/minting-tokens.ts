import express from 'express';
import { globals } from '../config/globals'
import path from 'path'
import fs from 'fs'

const router = express.Router();

router.post('/', async function(req, res, next) {
    console.log(req.body.colName, req.body.colAdd)
    var jsonFilePath = path.join(globals.RESULT_COLLECTION, `${req.body.colAdd}`.substring(2),"collectionInfo.json");
    
    var data = fs.readFileSync(jsonFilePath)
    var objJson = data.toString()
    res.render('minting-token',{ FileJson: objJson});
    
    
});
router.post('/minting', async function(req, res, next){
    console.log(req.body);
    res.send("root")
    
})

export {router as MintingTokens};