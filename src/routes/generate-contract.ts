import express from 'express';

import { Collection } from '../models/collection';
import { DescriptCollection } from '../models/descript-collection';
import { Parametr } from '../models/parametr';
import { Rarity } from '../models/rarity';
import { deleteContractDirTemp, generateContract } from '../services/contract-generator.service';


const router = express.Router();

router.get('/',  function(req, res, next) {
    
  let params : Parametr[] = [new Parametr("param1", "int"), new Parametr("param2", "string")];
  let rariry : Rarity[] = [new Rarity("rare", 10), new Rarity("norare", 90)];
  let description : DescriptCollection = new DescriptCollection("Collect1", 100);
  let collection : Collection = new Collection(description, rariry, params);

  generateContract(collection);

  res.send('Файлы сгенерированы');

});

export {router as generateContractRouter};
