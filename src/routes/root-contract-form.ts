import express from 'express';
const router = express.Router();

/* GET home page. */
router.get('/', function(req, res, next) {
    console.log("server");
    res.render('root-contract-form', { title: 'My Form' });
});



export {router as rootContractForm};
