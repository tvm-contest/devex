const process = require( "process" )
const dotenv = require( "dotenv" )

require('dotenv').config({ path: `.env.defaults` })
require('dotenv').config({ path: `.env.${process.env.NODE_ENV}` })
require('dotenv').config({ path: `.env` })

module.exports = process.env