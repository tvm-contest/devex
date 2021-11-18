import express from 'express';
const router = express.Router();

/* GET sample listing. */
router.get('/', function(req, res, next) {
  res.send('respond with a resource');
});

export {router as sampleRouter};