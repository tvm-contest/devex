import express from 'express';
import { everscale_settings } from '../config/everscale-settings';
import { DirectSaleService } from '../services/directSale.service';
import { DeployService } from '../services/deploy.service';
const router = express.Router();

router.post('/', async function(req, res, next) {
    res.render('token-sale',{rootAddress :req.body.rootAddress,tokenAddress:req.body.tokenAddress});
  });
router.post('/sale-token-form', async function(req, res, next) {
    const deployService = new DeployService();
    const directSaleService = new DirectSaleService();
    let RootNftAddr = new String(req.body.rootAddress).slice(2);
    console.log("path collection" + RootNftAddr)

    let NftAddr = req.body.tokenAddress;
    let directSaleAddr = await directSaleService.deployDirectSale(RootNftAddr, NftAddr);
    console.log("DirectSale address: " + directSaleAddr);
    
    while(true) {
      if (await deployService.isContractDeploy(directSaleAddr)) {
        break;
      }
    }
    
    let nftPrise = req.body.tokenPrice * Math.pow(10, 9);
    let isDurationLimited = false;
    let saleDuration = 0;
    await directSaleService.startSale(RootNftAddr, directSaleAddr, nftPrise, isDurationLimited, saleDuration);
    
    res.redirect("/collection-list");
  });

  export {router as SaleToken};