import express from 'express';
import fs from 'fs';
import path from 'path';
import { globals } from '../config/globals';
import { everscale_settings } from '../config/everscale-settings';
import { addFileToIPFS } from '../services/add-ipfs.service';
import { DeployService } from '../services/deploy.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
import { DirectSaleService } from '../services/directSale.service';
import { TonClient } from '@tonclient/core';
import { libNode } from '@tonclient/lib-node';
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
  let addrRoyaltyAgent = everscale_settings.AUTHOR_GENERATOR_ADDRESS;
  let addressRootNft = "270e3c5bddc9a3e0863226b5921a8ff573a8a016900f6a4cb1dff1f21aeafc5a";
  let rootAddr = await directSaleService.deployDirectSaleRoot(addressRootNft, addrRoyaltyAgent, 5);
  console.log(rootAddr);        // 0:eb1e65768afad81c7487e15b1bd778b0e9df6fdf9e2e9a0a6c796328f88e87ac
  let addressNft = "0:4e3d32c91ee449af6ac782ea89ae0893cbec04fc1262dea64f634cd3513d9cd7";
  
  await directSaleService.deployDirectSale(addressRootNft, addressNft);
});

export { router as sampleRouter };
