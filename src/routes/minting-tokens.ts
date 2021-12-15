import express from 'express';
import { globals } from '../config/globals'
import path from 'path'
import fs from 'fs'
//import { UploadedFile } from 'express-fileuploarouterd';
//var multipart = require('connect-multiparty');
const router = express.Router();
//const multipartMiddleware = multipart()
//router.use(multipart())



router.post('/', async function(req, res, next) {
    console.log(req.body.colName, req.body.colAdd)
    var jsonFilePath = path.join(globals.RESULT_COLLECTION, `${req.body.colAdd}`.substring(2),"collectionInfo.json");
    
    var data = fs.readFileSync(jsonFilePath)
    var objJson = data.toString()
    res.render('minting-token',{ FileJson: objJson});
    
    
});

router.post('/minting',function(req, res, next){
    console.log(req.body);
    console.log(req.files);
    res.send("root")
})


export {router as MintingTokens};