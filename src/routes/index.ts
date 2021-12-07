import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
  res.render('index', { title: 'NTF Collection Generator' });
});

export {router as indexRouter};
