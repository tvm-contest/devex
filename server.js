
const morganBody = require('morgan-body');
const express = require('express')
const bodyParser = require('body-parser')

const app = express()
 
// must parse body before morganBody as body will be logged
app.use(bodyParser.json());

// hook morganBody to express app
morganBody(app);

app.get('/api', function (req, res) {
  res.send('Hello World')
})
 
app.listen(3000)