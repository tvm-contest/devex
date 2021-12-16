import express from 'express';
import fs from 'fs';
import path from 'path';
import { globals } from '../config/globals';
import { everscale_settings } from '../config/everscale-settings';
import { addFileToIPFS } from '../services/add-ipfs.service';
import { DeployService } from '../services/deploy.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { DirectSaleService } from '../services/directSale.service';
const router = express.Router();

router.get('/deployService', async function (req, res, next) {
  //const solString = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'hello';}}";
  const filepath = path.join(globals.SAMPLE_DATA_PATH, '/stringContract.txt');
  var solString = fs.readFileSync(filepath, 'utf8');

  const d = new DeployService();
  var acc;

  try {
    acc = await d.createContractAccount(solString);
  } catch (err) { console.error(err); }
  finally {
    //console.log(acc);
  }

  try {
    await d.deploy(acc);
    const getTvc = await d.getDecodeTVC(acc);
    console.log(getTvc);
    const getDabi = await d.getDabi(acc);
    console.log(getDabi);

  } catch (err) {
    console.error(err);

  } finally {
    d.destructor();
  }
});

router.get('/deployTrueNftService', async function (req, res, next) {
  const deployTrueNftService = new DeployTrueNftService();
  const testPath = path.resolve(globals.BASE_PATH, "src" ,"sample-data", "trueNftSample");
  // deployTrueNftService.deployTrueNft(testPath);
});

router.get('/directSale', async function (req, res, next) {
  const directSaleService = new DirectSaleService();
  let addrRoyaltyAgent = everscale_settings.SAFE_MULTISIG_ADDRESS;
  let addressRootNft = "4db0ff55de68ef386cebecc285532dab1e497e1bfaae77a4b5b40049151745b1";
  //let rootAddr = await directSaleService.deployDirectSaleRoot(addressRootNft, addrRoyaltyAgent, 5);
  //console.log(rootAddr);        // 0:eb1e65768afad81c7487e15b1bd778b0e9df6fdf9e2e9a0a6c796328f88e87ac
  let addressNft = "0:b8d68a19e04b589e189b7a39fe8ed28779c00381f909c605b06928bea59bd5a4";
  
  await directSaleService.deployDirectSale(addressRootNft, addressNft);
});

export { router as sampleRouter };
