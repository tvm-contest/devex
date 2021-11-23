import express from 'express';
const router = express.Router();
const fs = require('fs');
const path = require('path');
import { globals } from '../config/globals'
import { addFileToIPFS } from '../services/add-ipfs.service';
import {DeployFromString} from '../services/deployFromString';

router.get('/addFileToIPFS', async function(req, res, next) {
  const filepath = path.join(globals.SAMPLE_DATA_PATH, '/textfile-test-ipfs-upload.txt');
  const file = fs.readFileSync(filepath, 'utf8');
  const CID = await addFileToIPFS(file);
  res.render('my-sample', { title: 'My-sample', CID: CID });
});

router.get('/deployService', async function(req, res, next) {
	const solString = path.join(globals.SAMPLE_DATA_PATH, '/stringContract.txt');
	const d = new DeployFromString(); 
  const acc = await d.createContractAccount(solString);
	const deploy = await d.deployMethod(acc);
  const getTvc = await d.getTvcDecode(acc);
  console.log(getTvc);
  const getDabi = await d.getDabi(acc);
  console.log(getDabi);
  await d.close();
});



export {router as sampleRouter};
