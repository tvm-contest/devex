import express from 'express';
const router = express.Router();
const fs = require('fs');
import { addFileToIPFS } from '../services/add-ipfs.service';

/* GET sample listing. */
router.get('/', async function(req, res, next) {
  const file = fs.readFileSync('text.txt', 'utf8');
  const CID = await addFileToIPFS(file);
  res.render('my-sample', { title: 'My-sample', CID: CID });
});

export {router as sampleRouter};
