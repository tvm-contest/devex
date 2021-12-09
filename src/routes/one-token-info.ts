import express from 'express';
import { TokenInfo, TokenInfoBuilder } from '../services/get-token-info.service';
const router = express.Router();

type OutputInfo = {
  isIPFS : boolean,
  value : string
}

/* GET home page. */
router.get('/', async function(req, res, next) {
  let tokenInfoBuilder = new TokenInfoBuilder();
  let tokenInfo : string[] | null;

  let outputInfo : OutputInfo[] | null = [];

  if (req.query.tokenAddress) {
    tokenInfo = await tokenInfoBuilder.getTokenInfo(req.query.tokenAddress.toString());
    tokenInfo.forEach((line) => {
      if (line.match(/ipfs.io\/ipfs/g)){
        outputInfo?.push({isIPFS: true, value: line.split(" ")[1]})
      } else {
        outputInfo?.push({isIPFS: false, value: line})
      }
    })
  } else {
    outputInfo = null;
  }

  res.render('one-token-info', {outputInfo: outputInfo});
});

export {router as oneTokenInfoRouter};
