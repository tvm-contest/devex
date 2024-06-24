import express from 'express';
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('parameter-form', { title: 'Parameter form' });
});

router.post('/', function(req, res, next) {
  console.log(JSON.stringify(req.body, null, 4));
});

export {router as parameterForm};
