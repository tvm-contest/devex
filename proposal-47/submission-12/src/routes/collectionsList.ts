import { GetCollectionsList } from "../services/collectionsList.service";

const express = require('express');
const router = express.Router();

router.get('/getCollections', async function(req, res) {
    try {
        const collectionsListGetter = new GetCollectionsList();
        const collectionsList = await collectionsListGetter.getCollectionsList();
        
        res.json(collectionsList)
    } catch(err) {
        console.error(`GET_LIST_ERROR ${err}`);
    }
});

router.get("/", function(req, res) {
    res.render('collectionsList');
})

export { router as collectionsListRouter };