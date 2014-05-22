'use strict';

var should = require('should'),
    fs = require('fs'),
    config = require('../../config/config'),
    Scheduler=require('../../server/scheduler'); 

var tasks = [{
    from:Date.parse("2014-02-11T17:00:00.000Z"),
    to:Date.parse("2014-02-11T20:00:00.000Z"), 
    channel:314,
},{
    from:Date.parse("2014-02-11T19:30:00.000Z"),
    to:Date.parse("2014-02-11T22:00:00.000Z"), 
    channel:215,
},{
    from:Date.parse("2014-02-11T21:00:00.000Z"),
    to:Date.parse("2014-02-11T23:00:00.000Z"), 
    channel:182,
}];
      

describe('Sample Tests', function() {   
    var scheduler, save_path=config.save_path;
    before(function(done){
        if(fs.existsSync(save_path))
            fs.unlinkSync(save_path)
        scheduler = Scheduler(save_path,done);
    });       
    it('should add sample tasks', function(done) {
        var expects = [{
                id:0,conflicts:[]},
            {
                id:1,
                conflicts:[0]
            },{
                id:2,
                conflicts:[1]
            }];
        function add_task(idx,next){
            var task = tasks[idx];
            scheduler.add(                
                task,
                function(result){
                    result.should.be.eql(expects[idx]); 
                    if(idx<tasks.length-1)
                        add_task(idx+1,next);
                    else
                        next();
                },function(err){
                    throw err ;
                }
            );  
        }               
        add_task(0,function(){
            scheduler.query([0,Date.parse("2020-01-01T00:00:00.000Z")],function(results){
                results.should.be.eql([0,1,2]);
                done();
            },function(){});
        });
    });

    it('should record 314 @ 2/11/2014 6:10pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T18:10:00.000Z"),function(results){
            results.should.be.eql([ 
                0
            ]);
            done();
        },function(){});
    });

    it('should record 215 @ 2/11/2014 8:30pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T20:30:00.000Z"),function(results){
            results.should.be.eql([ 
               1
            ]);
            done();
        },function(){});
    });

    it('should record 314 @ 2/11/2014 10:30pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T22:30:00.000Z"),function(results){
            results.should.be.eql([ 
                2
            ]);
            done();
        },function(){});
    });

    it('should not record  @ 2/11/2014 3:00pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T15:00:00.000Z"),function(results){
            results.should.be.eql([ 
                
            ]);
            done();
        },function(){});
    });

    it('should tell DVR conflicts  @ 2/11/2014 7:45pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T19:45:00.000Z"),function(results){
            results.should.be.eql([ 
                0,1
            ]);
            done();
        },function(){});
    });
});