'use strict';

var should = require('should'),
	fs = require('fs'),
	config=require('../../../config/config'),
    app,
    request = require('supertest');

describe('Schedule', function(){		
	before(function(done){
		if(fs.existsSync(config.save_path))
            fs.unlinkSync(config.save_path);      
        done();  
        app = require('../../../server');
    });
	describe("#create", function(){
		var tasks = [{
		    from:Date.parse("2014-02-11T17:00:00.000Z"),
		    to:Date.parse("2014-02-11T20:00:00.000Z"), 
		    channel:314
		},{
		    from:Date.parse("2014-02-11T20:00:00.000Z"),
		    to:Date.parse("2014-02-11T22:00:00.000Z"), 
		    channel:215
		},{
		    from:Date.parse("2014-02-11T14:00:00.000Z"),
		    to:Date.parse("2014-02-11T17:00:00.000Z"),
		    channel:182
		},{
		    from:Date.parse("2014-02-11T14:00:00.000Z"),
		    to:Date.parse("2014-02-11T22:00:00.000Z"),
		    channel:111
		}];
		it('should create a schedule', function(done){
			request(app)
				.post('/schedules')
				.send(tasks[0])							
				.expect(200)
				.expect({id:0, conflicts:[]},done);				
		});
	});

	describe("#delete", function(){							
		it('should delete a schedule by id', function(done){
			request(app)
				.delete('/schedules/0')				
				.expect(200)
				.end(function(err,res){
										
					done();
				});
		});			
	});
});