
require('dotenv').config()
const express = require('express')
const cors = require('cors')
const bodyParser = require('body-parser');
const app = express();
//app.use(express.json({urlencoded :true}))
app.use(cors())
app.use(bodyParser())
//app.use (express.limit('4k'));
app.use('/api/',require('./router/routes'))

module.exports = app