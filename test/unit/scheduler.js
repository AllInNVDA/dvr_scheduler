'use strict';

var should = require('should'),
    // _ = require('lodash'),
    scheduler=require('../../scheduler'); 


describe('Scheduler', function() {      
  describe('#add_task', function() {       
    it('should add a task t1', function(done) {              
      var rslt = scheduler.add(
        Date.parse("2014-02-11T17:00:00.000Z"),
        Date.parse("2014-02-11T20:00:00.000Z"),
        314,
        function(conflicts){
          conflicts.should.be.eql([]);
          done();
        }
      );
    });
    // it('should add a conflict task t2: t2.end = t1.start', function(done) {              
    //   var rslt = scheduler.add(
    //     Date.parse("2014-02-11T17:00:00.000Z"),
    //     Date.parse("2014-02-11T20:00:00.000Z"),
    //     314,
    //     function(conflicts){
    //       conflicts.should.be.eql([]);
    //       done();
    //     }
    //   );
    // });
    // it('should add a conflict task t3: t3.start = start', function(done) {              
    //   var rslt = scheduler.add(
    //     Date.parse("2014-02-11T17:00:00.000Z"),
    //     Date.parse("2014-02-11T20:00:00.000Z"),
    //     314,
    //     function(conflicts){
    //       conflicts.should.be.eql([]);
    //       done();
    //     }
    //   );
    // });
        
  });
});