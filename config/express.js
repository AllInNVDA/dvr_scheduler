'use strict';

var express = require('express'),
    path = require('path'),
    config = require('./config');

module.exports = function(app) {
    app.configure('development', function(){
        app.use(express.errorHandler());
        app.use(express.static(path.join(config.root, 'front')));
    });

    app.configure('production', function(){
        app.use(express.compress());
        app.use(express.static(path.join(config.root, 'public')));
    });

    app.configure('test', function(){
    });

    app.configure(function(){
        app.use(express.bodyParser());          
        app.use(express.methodOverride());   
        app.use(app.router);
    });
};