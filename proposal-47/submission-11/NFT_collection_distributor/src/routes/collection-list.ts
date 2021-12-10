import express from 'express';
import { Collection } from '../models/collection';
import { DescriptCollection } from '../models/descript-collection';
import { Parametr } from '../models/parametr';
import { Rarity } from '../models/rarity';
import { CollectionListService } from '../services/collection-list.service';
const router = express.Router();

router.get('/', async function(req, res, next) {
  let collectionListService = new CollectionListService();
  let collectionList = await collectionListService.getCollectionList();

  res.render('collection-list', { collectionList: collectionList });
});

export {router as collectionListRouter};
