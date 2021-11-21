import express from 'express';
import { addSingleParamToNftRoot } from '../services/add-params-to-nftRoot.service';
import { addSeveralParamsToNftRoot } from '../services/add-params-to-nftRoot.service';
import { ContractParam } from '../services/add-params-to-nftRoot.service';

const router = express.Router();

/* GET addParams listing. */
router.get('/', function(req, res, next) {

  let param : ContractParam = {
    type: String(req.query.paramType),
    name: String(req.query.paramName)
  }

  addSingleParamToNftRoot(param);

  //FOR TEST
  let testArray: ContractParam[]
  testArray = []
  for (let index = 0; index < 10; index++) {
    testArray.push( {type: req.query.paramType+'', name: req.query.paramName+''+index} ) 
  }
  addSeveralParamsToNftRoot(testArray)
  
  res.send('Контракт сформирован');
});

export {router as addParamsRouter};