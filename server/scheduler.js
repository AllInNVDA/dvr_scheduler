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
* @todo change the module to singleton
* @public
* @module scheduler
* @type {function}
*/
module.exports = function(save_path,done){
	/**
	* @description A lib called [interval-query](https://github.com/toberndo/interval-query) is used as the internal data structure to hold all schedule data.
	* But this lib is buggy and I've found a couple bugs for it. That's why I have to put this lib outside of the node_modules folder.  
	* @todo verify interval-query performance, write tests for it, find a better lib or implement interval tree by myself.
	*/	
	var intervals = new require('./lib/sequential').Sequential();
	/**
	* There is a bug in interval-query. Everytime a Sequential is created, the interval id won't get reset. 
	* To reset the id, intervals.clearIntervalStack() must be called.
	*/
	intervals.clearIntervalStack();
	
	var schedules = [] ;	

	/**
	* User calls this function to add a schedule
	*
	* @public
	* @async
	* @method add
	* @param {object} schedule the schedule object contains three properties: from, to and channel
	* @param {int} schedule.from the start time of the schedule in timestamp
	* @param {int} schedule.to the end time of the schedule in timestamp
	* @param {int} schedule.channel the channel to record
	* @param {function} next the callback function
	* @param {function} error the error callback function
	* @return {object} an id of the added schedule and a lists of conflict schedules
	*/
	function add(schedule,next,error){
		if(!validator.not_null(schedule)) return error("wrong arguments");
		if(!validator.not_null(schedule.from,schedule.to, schedule.channel)) return error("wrong arguments");
		if(!validator.is_number(schedule.from,schedule.to)) return error("wrong arguments");
		if(schedule.from>=schedule.to) return error("wrong arguments");

		/**
		* There will be no conflict if one schedule starts at a time another schedule ends.
		* So endpoints = false should be used here.
		*/		
		intervals.queryInterval(schedule.from, schedule.to,{endpoints:false,resultFn:function(conflicts){
			var id = intervals.pushInterval(schedule.from, schedule.to);
			schedule.id = id ;		
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
			},error);
		}});
	}

	/**
	* DVR calls this function to know to what to record at the specified time
	*
	* @public
	* @async
	* @method query
	* @param {int} time a time point
	* @param {function} next the callback function
	* @param {function} error the error callback function
	* @return {[int]} a list of prioritized channels
	*/
	function query(time,next,error){
		if(!validator.is_number(time)) return error("wrong arguments");
		intervals.queryPoint(time,function(intervals){
			next(_filter(intervals,time));
		});
	}

	/**
	* return all schedules
	*
	* @public
	* @method all
	* @return {[object]} all schedules 
	*/
	function all(){
		var i = 0 ;
		return schedules.filter(function(schedule){
			return !schedule.removed
		})
	}

	/**
	* User calls this function remove a schedule by id
	*
	* @public
	* @async
	* @method remove
	* @param {int} id the id of the schedule to be deleted
	* @param {function} next the callback function
	* @param {function} error the error callback function
	* @return {boolean} if removal is successful
	*/
	function remove(id,next,error){		
		if(!validator.not_null(id)) return error("id is null");
		if(!validator.is_number(id)) return error(id + " is not a number");
		if(!validator.not_null(schedules[id])) return error("cannot find the schedule");	
		/**
		* For simplicity, the schedule is not physically removed. This also makes undo deletion very simple. 
		* The drawback is that the DVR uses more memory. But how many recording tasks will be created in a person's life?
		*/
		schedules[id].removed = true;
		
		_save_operation(OPERATIONS.REMOVE,id,function(){
			return next && next(true);	
		},error);
		
	}
	
	/**
	* Filter out schedules that are marked as removed and end at the specified time
	*
	* @private	
	* @method _filter
	* @param {[object]} intervals 	a list of intervals need to be filtered
	* @param {int} time optional			any schedules that end on this time should be filtered
	* @return {[object]} a list of filtered schedules
	*/
	function _filter(intervals,time){
		var filtered_schedules = [];
		intervals.forEach(function(interval){
			var schedule = schedules[interval.id];
			if(schedule && !schedule.removed && schedule.to!=time)
				filtered_schedules.push(schedule);
		});
		return filtered_schedules;
	}

	/**
	* Save a user operation to the binary file
	*
	* @private	
	* @async
	* @method _save_operation
	* @param {int} operation 		an add or remove operation
	* @param {object} data 			operation data
	* @param {function} next the callback function
	* @param {function} error the error callback function
	*/
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

	
	/**
	* Load saved schedule data
	*/
	fs.readFile(save_path, function (error, buf) {
		if(!error){
			var i = 0 ;
			while(i<buf.length){
				var operation = buf.readUInt8(i); i++;
				if(operation === OPERATIONS.ADD){
					var from = buf.readDoubleLE(i); i+=8;	
					var to = buf.readDoubleLE(i); i+=8;	
					var channel = buf.readUInt16LE(i); i+=2;
					var id = intervals.pushInterval(from, to);
					var schedule = {from:from,to:to,channel:channel, id:id};											
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
		all:all,
		add:add,
		query:query,
		remove:remove
	};
}
