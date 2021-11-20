import express from 'express';
const router = express.Router();
const fs = require('fs');
const path = require('path');
import { globals } from '../config/globals'
import { addFileToIPFS } from '../services/add-ipfs.service';

router.get('/', async function(req, res, next) {
  const filepath = path.join(globals.APP_ROOT, globals.SAMPLE_DATA_PATH, '/textfile-test-ipfs-upload.txt');
  const file = fs.readFileSync(filepath, 'utf8');
  const CID = await addFileToIPFS(file);
  res.render('my-sample', { title: 'My-sample', CID: CID });
});

export {router as sampleRouter};

//const APP_ROOT = __dirname + '/../..';
