import { GetTokensList } from "../services/tokensList.service";
import { TokenInfoGetter } from "../services/getTokenInfo.service";
import { globals } from '../config/globals';
import path from "path";
import fs from "fs";
const express = require('express');
const router = express.Router();


type tokenInfoType = {
    tokenAddress: string,
    ownerAddress: string,
    rarityType: string
}


router.post('/', async function (req, res) {
    const rootAddress = req.body.address
    let dirName = rootAddress.split(":");
    const tokensListGetter = new GetTokensList();
    const tokensList = await tokensListGetter.getTokensList(rootAddress, dirName[1]);
    const infoGetter = new TokenInfoGetter()
    const tokenInfoList = new Array<tokenInfoType>()
    for (let token of tokensList) {
        try {
            const info = await infoGetter.getTokenInfo(token, dirName[1]);
            console.log(info);

            const abiPath = path.join(globals.TEMP_PATH, dirName[1], "Data.abi.json");
            let dataAbi = JSON.parse(fs.readFileSync(abiPath).toString());
            const res = dataAbi.functions.find(i => i.name == "getParamsInfo");

            const convert = (from, to) => (data) => Buffer.from(data, from).toString(to);
            const hexToUtf8 = convert("hex", "utf8");
            
            const params = new Array<any>();
            for (let param of res.outputs)
            {
                let paramData = info.params[param.name];
                if(param.type == "bytes")
                {
                   paramData = hexToUtf8(info.params[param.name]);
                }
                
                const name = param.name
                const paramJson = {
                    name: name,
                    data: paramData
                }

                params.push(paramJson)
                console.log(param.name + ":   " + paramData);
            }

            const tokenInfo = {
                tokenAddress: token,
                ownerAddress: info.addresses.addrOwner,
                rarityType: "", //_rarityType
                params: params
            }
            tokenInfoList.push(tokenInfo)
        } catch (error) {
            console.log(error);
        }
    }

    res.render('tokensList', {
        tokens: tokenInfoList
    });
});

router.get("/", function (req, res) {
    res.render("addressInputForm")
})

export { router as tokensListRouter };