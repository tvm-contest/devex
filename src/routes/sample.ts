import express from 'express';
import { consoleTerminal } from 'tondev';
import fs from 'fs';
import path from 'path';
import { globals } from '../config/globals'
import { addFileToIPFS } from '../services/add-ipfs.service';
import { DeployService } from '../services/deploy.service';
import { DeployTrueNftService } from '../services/deployTrueNft.service';
const router = express.Router();

import { t } from '../services/gen-images.service';

router.get('/addFileToIPFS', async function (req, res, next) {
  const filepath = path.join(globals.SAMPLE_DATA_PATH, '/textfile-test-ipfs-upload.txt');
  const file = fs.readFileSync(filepath, 'utf8');
  const CID = await addFileToIPFS(file);
  res.render('my-sample', { title: 'My-sample', CID: CID });
});

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
  const testPath = path.resolve(globals.BASE_PATH, "src", "sample-data", "trueNftSample");
  deployTrueNftService.deployTrueNft(testPath);
});

router.get('/color', async function (req, res) {
  console.log(await t.createImagesArr());
});

export { router as sampleRouter };
