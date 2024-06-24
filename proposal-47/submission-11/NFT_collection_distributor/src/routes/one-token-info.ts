import express from 'express';
import { TokenInfo, TokenInfoBuilder } from '../services/get-token-info.service';
const router = express.Router();

/* GET home page. */
router.get('/', async function(req, res, next) {
  let tokenInfoBuilder = new TokenInfoBuilder();
  let tokenInfo : TokenInfo[] | null;

  if (req.query.tokenAddress) {
    tokenInfo = await tokenInfoBuilder.getTokenInfo(req.query.tokenAddress.toString());
  } else {
    tokenInfo = null;
  }

  res.render('one-token-info', {tokenInfo: tokenInfo});
});

export {router as oneTokenInfoRouter};
