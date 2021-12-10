import { GetTokensList } from "../services/tokensList.service";
import { TokenInfoGetter } from "../services/getTokenInfo.service";
const express = require('express');
const router = express.Router();

router.post('/', async function(req, res) {
    const rootAddress = req.body.address
    let dirName = rootAddress.split(":");
    const tokensListGetter = new GetTokensList();

    const tokensList = await tokensListGetter.getTokensList(rootAddress, dirName[1]);
    console.log(tokensList);

    const infoGetter = new TokenInfoGetter()
	const tokenInfoList = new Array<any>()
    for(let token of tokensList) {
		const info = await infoGetter.getTokenInfo(token, dirName[1])
        const tokenInfo = {
			tokenAddress: token,
			ownerAddress: info.data._addrOwner,
			rarityType: info.data._rarityType
		}

		tokenInfoList.push(tokenInfo)
    }

    res.render('tokensList', {
        tokens: tokenInfoList
    });
});

router.get("/", function(req, res) {
    res.render("addressInputForm")
})

export { router as tokensListRouter };