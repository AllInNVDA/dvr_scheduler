'use strict';

var path = require('path');
var rootPath = path.normalize(__dirname + '/../..');

module.exports = {
	num_tuners:1,
	root: rootPath,
	port: process.env.PORT || 3001,
}
