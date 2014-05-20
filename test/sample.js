'use strict';

var should = require('should'),
    scheduler=require('../scheduler'); 

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
    it('should add sample tasks', function(done) {
        var expects = [[
            //empty array
        ],[{
            id:2,
            from:tasks[0].from,
            to:tasks[0].to
        }],[{
            id:4,
            from:tasks[1].from,
            to:tasks[1].to
        }]];
        function add_task(idx,next){
            var task = tasks[idx];
            var rslt = scheduler.add(
                task.from,
                task.to,
                314,
                function(conflicts){
                    conflicts.should.be.eql(expects[idx]); 
                    if(idx<tasks.length-1)
                        add_task(idx+1,next);
                    else
                        next();
                }
            );  
        }               
        add_task(0,function(){
            scheduler.query([0,Date.parse("2020-01-01T00:00:00.000Z")],function(){},function(results){
                results.should.be.eql([ 
                    { id: 2, from: 1392138000000, to: 1392148800000 },
                    { id: 4, from: 1392147000000, to: 1392156000000 },
                    { id: 6, from: 1392152400000, to: 1392159600000 } 
                ]);
                done();
            });
        });
    });

    it('should tell DVR to record 314 @ 2/11/2014 6:10pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T18:10:00.000Z"),function(){},function(results){
            results.should.be.eql([ 
                {
                    id:2,
                    from:tasks[0].from,
                    to:tasks[0].to
                }
            ]);
            done();
        })
    });

    it('should tell DVR to record 215 @ 2/11/2014 8:30pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T20:30:00.000Z"),function(){},function(results){
            results.should.be.eql([ 
                {
                    id:4,
                    from:tasks[1].from,
                    to:tasks[1].to
                }
            ]);
            done();
        })
    });

    it('should tell DVR to record 314 @ 2/11/2014 10:30pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T22:30:00.000Z"),function(){},function(results){
            results.should.be.eql([ 
                {
                    id:6,
                    from:tasks[2].from,
                    to:tasks[2].to
                }
            ]);
            done();
        })
    });

    it('should tell DVR to not record  @ 2/11/2014 3:00pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T15:00:00.000Z"),function(){},function(results){
            results.should.be.eql([ 
                
            ]);
            done();
        })
    });

    it('should tell DVR conflicts  @ 2/11/2014 7:45pm', function(done) {              
        scheduler.query(Date.parse("2014-02-11T19:45:00.000Z"),function(){},function(results){
            results.should.be.eql([ 
                {
                    id:2,
                    from:tasks[0].from,
                    to:tasks[0].to
                },{
                    id:4,
                    from:tasks[1].from,
                    to:tasks[1].to
                }
            ]);
            done();
        })
    });
});