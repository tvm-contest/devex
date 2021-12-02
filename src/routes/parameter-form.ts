import express from 'express';
const router = express.Router();

router.get('/', function(req, res, next) {
  res.render('parameter-form', { title: 'Parameter form' });
});

router.post('/', function(req, res, next) {
  console.log(req.body)
});

export {router as parameterForm};
