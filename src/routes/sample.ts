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

router.get('/testDeploy', async function(req, res, next) {
	const solString = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'helloWorld';}}";
	const d = new DeployFromString(); 
	const deploy = await d.deployMethod(solString);

  const getTvc = await d.getTvcDecode(solString);
  console.log(getTvc);

  const getDabi = await d.getDabi(solString);
  console.log(getDabi);
  
  //await d.close();


});



export {router as sampleRouter};
