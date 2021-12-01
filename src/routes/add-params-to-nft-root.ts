import express from 'express';
import path from 'path';
import { globals } from '../config/globals';
import { Parametr } from '../models/parametr';
import { AddParamsService } from '../services/add-params.service';

const router = express.Router();

/* GET addParams listing. */
router.get('/', function(req, res, next) {

  let param : Parametr = new Parametr(
    String(req.query.paramName),
    String(req.query.paramType)
  )

  let addParamsService = new AddParamsService()

  addParamsService.addSingleParam(param, path.join(globals.SAMPLE_DATA_PATH, "NftRoot.sol"));

  //FOR TEST
  let testArray: Parametr[]
  testArray = []
  for (let index = 0; index < 10; index++) {
    testArray.push(new Parametr(req.query.paramName + '' + index, req.query.paramType + '')) 
  }
  addParamsService.addSeveralParams(testArray, path.join(globals.SAMPLE_DATA_PATH, "NftRoot.sol"))
  
  res.send('Контракт сформирован');
});

export {router as addParamsRouter};