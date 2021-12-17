import { GetTokensList } from "../services/tokensList.service";
import { TokenInfoGetter } from "../services/getTokenInfo.service";
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
            const convert = (from, to) => (data) => Buffer.from(data, from).toString(to);
            const utf8ToHex = convert("utf8", "hex");
            let _rarityType = utf8ToHex(info.rarity);
            // console.log(token);
            // console.log(info.data._addrOwner);
            // console.log(_rarityType);

            const tokenInfo = {
                tokenAddress: token,
                ownerAddress: info.addresses.addrOwner,
                rarityType: _rarityType
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