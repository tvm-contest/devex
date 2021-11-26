import express from 'express';
import path from 'path';
import { globals } from '../config/globals';
import { Parametr } from '../models/parametr';
import { addSingleParam } from '../services/add-params.service';
import { addSeveralParams } from '../services/add-params.service';

const router = express.Router();

/* GET addParams listing. */
router.get('/', function(req, res, next) {

  let param : Parametr = new Parametr(
    String(req.query.paramName),
    String(req.query.paramType)
  )

  addSingleParam(param, path.join(globals.APP_ROOT, "data-samples", "NftRoot.sol"));

  //FOR TEST
  let testArray: Parametr[]
  testArray = []
  for (let index = 0; index < 10; index++) {
    testArray.push( new Parametr(req.query.paramName+''+index, req.query.paramType+'') ) 
  }
  addSeveralParams(testArray, path.join(globals.APP_ROOT, "data-samples", "NftRoot.sol"))
  
  res.send('Контракт сформирован');
});

export {router as addParamsRouter};