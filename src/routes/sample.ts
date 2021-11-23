import express from 'express';
import { consoleTerminal } from 'tondev';
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
	const solString = "pragma ton-solidity >= 0.35.0; pragma AbiHeader expire; contract helloworld {function renderHelloWorld () public pure returns (string) {return 'hello';}}";
	const d = new DeployFromString();
  var acc; 
 
  try {
   acc = await d.createContractAccount(solString);
  } catch(err) { console.error(err);}
  finally {
    //console.log(acc);
  }

  try {
    const deploy = await d.deployMethod(acc);
    const getTvc = await d.getTvcDecode(acc);
    console.log(getTvc);
    const getDabi = await d.getDabi(acc);
    console.log(getDabi);

  } catch(err) {
    console.error(err);

  } finally {
    await d.close();
  }


});



export {router as sampleRouter};
