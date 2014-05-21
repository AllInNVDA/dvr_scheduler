
var express = require('express');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config/config');

var app = express();

require('./config/express')(app);
require('./config/routes')(app);

var port = process.env.PORT || config.port;
app.listen(port);



