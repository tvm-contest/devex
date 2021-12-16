import express from 'express';
const router = express.Router();

router.post('/', async function(req, res, next) {
    res.render('token-sale',{rootAddress :req.body.rootAddress,tokenAddress:req.body.tokenAddress});
  });
router.post('/sale-token-form', async function(req, res, next) {
    console.log(req.body.rootAddress)
    console.log(req.body.tokenAddress)
    console.log(req.body.tokenPrice)
    
    res.send("token-sale")
  });

  export {router as SaleToken};