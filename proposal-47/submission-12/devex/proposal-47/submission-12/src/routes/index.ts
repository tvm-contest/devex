import express from 'express';
const router = express.Router();


/* GET home page. */
router.get('/', function(req, res, next) {
  console.log('we are at index page');
  res.render('index', { title: 'Express' });
});

export {router as indexRouter};
