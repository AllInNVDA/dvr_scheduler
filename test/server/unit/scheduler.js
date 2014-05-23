'use strict';

var should = require('should'),
	fs = require('fs'),
	config=require('../../../config/config'),
    Scheduler=require('../../../server/scheduler');  

describe('Scheduler', function() {     
	var scheduler, save_path=config.save_path;
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
	before(function(done){
		if(fs.existsSync(save_path))
            fs.unlinkSync(save_path);
        scheduler = Scheduler(save_path,done);
    });        
	describe('#add', function() {       		
		var bad_tasks = [{
			//from > to
		    from:Date.parse("2014-02-11T20:00:00.000Z"), 
		    to:Date.parse("2014-02-11T17:00:00.000Z"),
		    channel:314,
		},{
			//from === to
		    from:Date.parse("2014-02-11T20:00:00.000Z"),
		    to:Date.parse("2014-02-11T20:00:00.000Z"),
		    channel:215,
		},{
			//no from
		    to:Date.parse("2014-02-11T20:00:00.000Z"),
		    channel:215,
		},{
			//no to
		    from:Date.parse("2014-02-11T20:00:00.000Z"),
		    channel:215,
		},{
			//no channel info
		    from:Date.parse("2014-02-11T21:00:00.000Z"),
		    to:Date.parse("2014-02-11T23:00:00.000Z"),         
		},{},null,undefined,Infinity,NaN];
		it('should add a task t0', function(done){
			scheduler.add(tasks[0],function(result){
				result.should.be.eql({id:0,conflicts:[]});
				done();
			});
		});
		it('should add a task t1: t1.start = t0.end without conflicts', function(done){
			scheduler.add(tasks[1],function(result){
				result.should.be.eql({id:1,conflicts:[]});
				done();
			});
		});
		it('should add a task t2: t2.end = t0.start without conflicts', function(done){
			scheduler.add(tasks[2],function(result){
				result.should.be.eql({id:2,conflicts:[]});
				done();
			});
		});
		it('should add a task t3 with 3 conflicts', function(done){
			scheduler.add(tasks[3],function(result){
				result.should.be.eql({id:3,conflicts:[tasks[0],tasks[1],tasks[2]]});
				done();
			});
		});
		it('should throw errors for bad tasks', function(done){
			function add_bad_task(idx){
		        var task = bad_tasks[idx];
		        scheduler.add(
		            task,
		            function(){
		            	throw "should not get to here!";
		            },
		            function(err){
		            	err.should.be.ok;
		                if(idx<bad_tasks.length-1)
		                    add_bad_task(idx+1);
		                else
		                	done();
		            }
		        );
		    }
		    add_bad_task(0);
		});
	});
	describe('#point query - 1 tuner',function(){		
		before(function(done){
			scheduler.set_tuner_count(1);
			done();
		})
		it('should return 0 task at 2014-02-11 13:59:59.999', function(done){				
			scheduler.query(Date.parse("2014-02-11T13:59:59.999Z"),function(results){					
                results.should.eql([]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 1 task with highest priority at 2014-02-11 14:00:00.000', function(done){						
			scheduler.prioritize(3,2);
			scheduler.query(Date.parse("2014-02-11T14:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[3].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 1 task with highest priority at 2014-02-11 17:00:00.000', function(done){			
			scheduler.prioritize(0,1);
			scheduler.query(Date.parse("2014-02-11T17:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[0].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 1 task with highest priority at 2014-02-11 20:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T20:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[3].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 0 task at 2014-02-11 22:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T22:00:00.000Z"),function(results){					
                results.should.containDeep([]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
	});	
	describe('#point query - 2 tuners',function(){		
		before(function(done){
			scheduler.set_tuner_count(2);
			done();
		})
		it('should return 0 task at 2014-02-11 13:59:59.999', function(done){				
			scheduler.query(Date.parse("2014-02-11T13:59:59.999Z"),function(results){					
                results.should.eql([]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks sorted by their priorities at 2014-02-11 14:00:00.000', function(done){						
			scheduler.query(Date.parse("2014-02-11T14:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[3].channel,tasks[2].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks sorted by their priorities at 2014-02-11 17:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T17:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[0].channel,tasks[3].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks at 2014-02-11 20:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T20:00:00.000Z"),function(results){					
                results.should.containDeep([tasks[3].channel,tasks[1].channel]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 0 task at 2014-02-11 22:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T22:00:00.000Z"),function(results){					
                results.should.containDeep([]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
	});	
	describe('#remove',function(){
		it('should delete the task t0', function(done){
			scheduler.remove(0,function(result){
				result.should.be.eql(true);
                scheduler.all().should.not.containEql({id:0});
                done();
			});
		});
		it('should give error when deleting nonexisting task', function(done){
			scheduler.remove(100,function(result){
				throw "should not get here";	                				
			},function(err){
				err.should.be.ok;
				done();
			});
		});
		it('should give error when providing a bad task id', function(done){
			scheduler.remove(null,function(result){
				throw "should not get here";	                				
			},function(err){
				err.should.be.ok;
				done();
			});
		});
	});
	describe('#constructor',function(){
		it('should load schedule data from the file',function(done){
			var scheduler2 = Scheduler(save_path,function(){
                scheduler2.all().should.containDeep([{id:1},{id:2},{id:3}]);
                done();
			});
			
		})
	})
});