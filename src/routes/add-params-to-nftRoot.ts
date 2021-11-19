import express from 'express';
import { addSingleParamToNftRoot } from '../services/add-params-to-nftRoot.service';
import { addSeveralParamsToNftRoot } from '../services/add-params-to-nftRoot.service';

const router = express.Router();

/* GET addParams listing. */
router.get('/', function(req, res, next) {
  addSingleParamToNftRoot(String(req.query.paramType), String(req.query.paramName));

  //FOR TEST
  var testArray: Array<[string, string]>
  testArray = []
  for (let index = 0; index < 10; index++) {
    testArray.push( [ req.query.paramType + '', req.query.paramName + '' + index] ) 
  }
  addSeveralParamsToNftRoot(testArray)
  
  res.send('respond with a resource');
});

export {router as addParamsRouter};