import { GetTokensList } from "../services/tokensList.service";
import { TokenInfoGetter } from "../services/get-token-info.service";
import { globals } from "../config/globals";
const express = require('express');
const router = express.Router();

router.post('/', async function(req, res) {
    const testAddress = "0:c3a5bea163d0ac25b24f25d59b56d1c2a5428adde6ccedb4e4795d460f2706d6";
    const rootAddress = req.body.address
    let dirName = rootAddress.split(":");
    const tokensListGetter = new GetTokensList();

    const tokensList = await tokensListGetter.getTokensList(rootAddress, dirName[1]);
    console.log(tokensList);

    const infoGetter = new TokenInfoGetter()
	const tokenInfoList = new Array<any>()
    for(let token of tokensList) {
		const info = await infoGetter.getTokenInfo(token)
        const tokenInfo = {
			rootAddress: info.data._addrRoot,
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