'use strict';

var should = require('should'),
    scheduler=require('../../../server/scheduler'); 

describe('Scheduler', function() {      
	describe('#add', function() {       
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
				result.should.be.eql({id:3,conflicts:[0,1,2]});
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
	describe('#point query',function(){
		it('should return 0 task at 2014-02-11 13:59:59.999', function(done){			
			scheduler.query(Date.parse("2014-02-11T13:59:59.999Z"),function(results){					
                results.should.eql([]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks at 2014-02-11 14:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T14:00:00.000Z"),function(results){					
                results.should.containDeep([2,3]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks at 2014-02-11 17:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T17:00:00.000Z"),function(results){					
                results.should.containDeep([0,3]);
                done();
            },function(){
            	throw "should not get here";
            });
		});
		it('should return 2 tasks at 2014-02-11 20:00:00.000', function(done){			
			scheduler.query(Date.parse("2014-02-11T20:00:00.000Z"),function(results){					
                results.should.containDeep([1,3]);
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
				scheduler.query([0,Date.parse("2020-01-01T00:00:00.000Z")],function(results){					
	                results.should.not.containEql(0);
	                done();
	            },function(){
	            	throw "should not get here";
	            });				
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
});