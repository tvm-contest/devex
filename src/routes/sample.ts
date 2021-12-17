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
  // адрес коллекции, для определения пути к коллекции
  let RootNftAddr = "270e3c5bddc9a3e0863226b5921a8ff573a8a016900f6a4cb1dff1f21aeafc5a";

  // создание рута продаж
  let addrRoyaltyAgent = everscale_settings.AUTHOR_GENERATOR_ADDRESS;
  let directSaleRootAddr = await directSaleService.deployDirectSaleRoot(RootNftAddr, addrRoyaltyAgent, 5);
  console.log("DirectSaleRoot address: " + directSaleRootAddr);
  
  // создание продажи
  let NftAddr = "0:8d4dcf35bf935400d9e169ac4aa62a666015e518648aab6b1b15cdc75d37ce92";
  let directSaleAddr = await directSaleService.deployDirectSale(RootNftAddr, NftAddr);
  console.log("DirectSale address: " + directSaleAddr);
  
  // страт продаж
  let nftPrise = 500000;
  await directSaleService.startSale(RootNftAddr, directSaleAddr, nftPrise, false, 0);

});

export { router as sampleRouter };
