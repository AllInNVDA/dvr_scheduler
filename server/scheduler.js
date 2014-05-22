/** 
## DVR Scheduler
*/

'use strict';

var fs = new require('fs'),
	validator = require("./validator");

var OPERATIONS = {
	ADD:1,
	REMOVE:2
};

/**
* This is the interval tree based scheduler module
*
* @public
* @module scheduler
* @type {function}
*/
module.exports = function(save_path,done){
	/**
	* @description A lib called interval-query(https://github.com/toberndo/interval-query) is used as the interval data structure to provide quick data manipulation.
	* But this lib is buggy and I've found a couple bugs for it. That's why I have to put this lib outside of the node_modules folder.  
	* @todo verify its performance, write tests for it, find a better lib or implement interval tree by myself.
	*/	
	var intervals = new require('./lib/sequential').Sequential();
	/**
	* There is a bug in interval-query. Everytime a Sequential is created, the interval id won't get reset. 
	* To reset the id, intervals.clearIntervalStack() must be called.
	*/
	intervals.clearIntervalStack();
	
	var schedules = [] ;	

	/**
	* Add a schedule
	*
	* @public
	* @async
	* @method add
	* @param {object} schedule the schedule object contains three properties: from, to and channel
	* @param {int} schedule.from the start time of the schedule in timestamp
	* @param {int} schedule.to the end time of the schedule in timestamp
	* @param {int} schedule.channel the channel to record
	* @param {function} next the callback function
	* @param {function} err the error callback function
	*/
	function add(schedule,next,err){
		if(!validator.not_null(schedule)) return err("wrong arguments");
		if(!validator.not_null(schedule.from,schedule.to, schedule.channel)) return err("wrong arguments");
		if(!validator.is_number(schedule.from,schedule.to)) return err("wrong arguments");
		if(schedule.from>=schedule.to) return err("wrong arguments");	
		intervals.queryInterval(schedule.from, schedule.to,{endpoints:false,resultFn:function(conflicts){
			var id = intervals.pushInterval(schedule.from, schedule.to);		
			schedules[id] = schedule;		

			/**
			* A DVR can stop working for any reason. So the schedule data must be save somewhere presistently and restored once the DVR restarts.
			* See Issue #2 and #3. Currently, add and delete operations are appended to a local file through saveoperation function
			*/	
			_save_operation(OPERATIONS.ADD,schedule,function(){
				return next && next({
					id:id,
					conflicts:_filter(conflicts)
				});
			},err);
		}});
	}

	/**
	* Search schedules by a time point or a time range
	*
	* @public
	* @async
	* @method query
	* @param {int or ints} time a time point if a single integer is provided, or a time range if two integers are provided
	* @param {function} next the callback function
	* @param {function} err the error callback function
	*/
	function query(time,next,err){
		if(typeof time === "number" )
			intervals.queryPoint(time,function(intervals){
				next(_filter(intervals,time));
			});
		else if(time.length && time.length ===2)
			intervals.queryInterval(time[0],time[1],{endpoints:false, resultFn: function(intervals){
				next(_filter(intervals));
			}});
		else
			err("wrong arguments");
	}

	/**
	* Remove a schedule by id
	*
	* @public
	* @async
	* @method remove
	* @param {int} id the id of the schedule to be deleted
	* @param {function} next the callback function
	* @param {function} err the error callback function
	*/
	function remove(id,next,err){		
		if(!validator.not_null(id)) return err("id is null");
		if(!validator.is_number(id)) return err(id + " is not a number");
		if(!validator.not_null(schedules[id])) return err("cannot find the schedule");	
		/**
		* For simplicity, the schedule is not physically removed. This also makes undo deletion very simple. 
		* The drawback is that the DVR uses more memory. But how many recording tasks will be created in a person's life?
		*/
		schedules[id].removed = true;
		
		_save_operation(OPERATIONS.REMOVE,id,function(){
			return next && next(true);	
		},err);
		
	}
	
	/**
	* Filter out deleted schedules
	* Filter out schedules that end at the specified time
	*
	* @private	
	* @method _filter
	* @param {object}
	* @param {int} 
	*/
	function _filter(intervals,time){
		var ids = [];
		intervals.forEach(function(interval){
			var schedule = schedules[interval.id];
			if(schedule && !schedule.removed && (time==null||schedule.to>time))
				ids.push(interval.id);
		});
		return ids;
	}

	function _save_operation(operation,data,next,error){
		var buf ,i = 0 ;
		if(operation === OPERATIONS.ADD){
			buf = new Buffer(19);
			buf.writeUInt8(OPERATIONS.ADD,i); i++ ;
			buf.writeDoubleLE(data.from,i); i+=8;	
			buf.writeDoubleLE(data.to,i); i+=8;	
			buf.writeUInt16LE(data.channel,i); i+=2;
		}else if(operation === OPERATIONS.REMOVE){
			buf = new Buffer(5);
			buf.writeUInt8(OPERATIONS.REMOVE,i); i++ ;
			buf.writeUInt32LE(data,i); i+=4;				
		}
		fs.appendFile(save_path, buf, function (e) {
			if(e) return error && error(e);
			return next && next();
		});
	}

	

	fs.readFile(save_path, function (err, buf) {
		if(!err){
			var i = 0 ;
			while(i<buf.length){
				var operation = buf.readUInt8(i); i++;
				if(operation === OPERATIONS.ADD){
					var from = buf.readDoubleLE(i); i+=8;	
					var to = buf.readDoubleLE(i); i+=8;	
					var channel = buf.readUInt16LE(i); i+=2;
					var schedule = {from:from,to:to,channel:channel};
					var id = intervals.pushInterval(schedule.from, schedule.to);						
					schedules[id] = schedule;					
				}else if(operation === OPERATIONS.REMOVE){
					var id = buf.readUInt32LE(i); i+=4;					
					schedules[id].removed = true;
				}
			}
		}	
		done();
	});

	return {
		add:add,
		query:query,
		remove:remove
	};
}
