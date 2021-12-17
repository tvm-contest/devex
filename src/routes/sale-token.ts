import express from 'express';
import { everscale_settings } from '../config/everscale-settings';
import { DirectSaleService } from '../services/directSale.service';
const router = express.Router();

router.post('/', async function(req, res, next) {
    res.render('token-sale',{rootAddress :req.body.rootAddress,tokenAddress:req.body.tokenAddress});
  });
router.post('/sale-token-form', async function(req, res, next) {
    const directSaleService = new DirectSaleService();
    let RootNftAddr = new String(req.body.rootAddress).slice(2);
    console.log("path collection" + RootNftAddr)

    let addrRoyaltyAgent = everscale_settings.AUTHOR_GENERATOR_ADDRESS;
    let directSaleRootAddr = await directSaleService.deployDirectSaleRoot(RootNftAddr, addrRoyaltyAgent, 5);
    console.log("DirectSaleRoot address: " + directSaleRootAddr);
  
    let NftAddr = req.body.tokenAddress;
    let directSaleAddr = await directSaleService.deployDirectSale(RootNftAddr, NftAddr);
    console.log("DirectSale address: " + directSaleAddr);
  
    let nftPrise = req.body.tokenPrice;
    let isDurationLimited = false;
    let saleDuration = 0;
    await directSaleService.startSale(RootNftAddr, directSaleAddr, nftPrise, isDurationLimited, saleDuration);
    
    res.send("token-sale")
  });

  export {router as SaleToken};