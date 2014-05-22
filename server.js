
var express = require('express');

process.env.NODE_ENV = process.env.NODE_ENV || 'development';

var config = require('./config/config');


var app = express();

require('./config/express')(app);

var scheduler = require('./server/scheduler')(config.save_path,function(){
	require('./config/routes')(app, scheduler);
	var port = process.env.PORT || config.port;	
	app.listen(port);
});

exports = module.exports = app;





