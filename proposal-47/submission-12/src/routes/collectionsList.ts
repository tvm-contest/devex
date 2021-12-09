import { GetCollectionsList } from "../services/collectionsList.service";

const express = require('express');
const router = express.Router();

router.get('/', async function(req, res) {
    try {
        const collectionsListGetter = new GetCollectionsList();
        const collectionsList = await collectionsListGetter.getCollectionsList();
        
        res.render('collectionsList', {
            collections: collectionsList
        });
    } catch(err) {
        console.error(`GET_LIST_ERROR ${err}`);
    }
});

export { router as collectionsListRouter };