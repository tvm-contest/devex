import express from 'express';
import { NFTCollectionJSON } from '../services/deployForm.service';

const router = express.Router();

router.get("/", function(req, res, next) {
    res.render("createCollectionForm")
})

router.post("/", function(req, res, next) {
    NFTCollectionJSON.deploy(req.body);
})
  
export {router as createCollectionRouter};
  