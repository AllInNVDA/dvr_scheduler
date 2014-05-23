/** 
## DVR Scheduler
*/

'use strict';

var fs = new require('fs'),
	config = require('../config/config'),
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

	var number_of_tuners = config.num_tuners;	

	/**
	* Set the number of available tuners
	*
	* @public
	* @method set_tuner_count
	* @param {int} n number of tuners are in use
	*/
	function set_tuner_count(n){
		number_of_tuners = n;
	}

	/**
	* Get the number of available tuners
	*
	* @public
	* @method get_tuner_count
	* @return {int} number of tuners
	*/
	function get_tuner_count(){
		return number_of_tuners;
	}

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
		if(!validator.not_null(schedule)) return error("schedule is null");
		if(!validator.not_null(schedule.from,schedule.to, schedule.channel)) return error("some schedule properties are null");
		if(!validator.is_number(schedule.from,schedule.to)) return error("from and to are not numbers");
		if(schedule.from>=schedule.to) return error("from >= to");

		/**
		* There will be no conflict if one schedule starts at a time another schedule ends.
		* So endpoints = false should be used here.
		*/		
		intervals.queryInterval(schedule.from, schedule.to,{endpoints:false,resultFn:function(conflicts){
			for(var i=0 ; i<conflicts.length ; i++){
				var conflict_schedule = schedules[conflicts[i].id];
				/**
				* Do not add the same schedule again				
				*/		
				if(	conflict_schedule.channel === schedule.channel &&
					conflict_schedule.from === schedule.from &&
					conflict_schedule.to === schedule.to){
					var ret =	{
						id:conflicts[i].id, 
						conflicts:_process_conflicts(conflicts,null,schedule.channel), 
						exist:!conflict_schedule.removed
					}
					conflict_schedule.removed = false;					
					return next(ret);
				}
					
			}
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
					/**
					* @todo: If the user sends two conflit tasks for the same channel, these two tasks can be merged.
					* For simplicity, currently I just remove the same-channel recording task from the conflicts and 
					* will deduplicate channel ids when DVR requests the schedule
					*/
					conflicts:_process_conflicts(conflicts,null,schedule.channel)
				});
			},error);
		}});
	}

	/**
	* User calls this function to add a list of schedules
	*
	* @public
	* @async
	* @method add_array
	* @param {[object]} schedules a list of schedules	
	* @param {function} next the callback function
	* @param {function} error the error callback function
	* @return {[object]} a list of objects with ids and conflits of the schedules
	*/
	function add_array(schedules,next,error){
		if(!Array.isArray(schedules)) return error("the first parameter is not an array.");
		var results = [];
		function add_one(idx){
			if(idx >= schedules.length) return next(results);
			add(schedules[idx],function(result){
				results.push(result);
				add_one(idx+1);
			},error);
		}
		add_one(0);
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
	* @todo deduplicate channel ids
	*/
	function query(time,next,error){
		if(!validator.is_number(time)) return error("wrong arguments");
		intervals.queryPoint(time,function(intervals){
			var conflicts = _process_conflicts(intervals,time);

			/**
			* Must delete null and NaN, otherwise they will appear at the top
			*/
			var channels = conflicts.sort(function(a,b){
				if(a.priority === null || isNaN(a.priority))
					return 1
				if(b.priority === null || isNaN(b.priority))
					return -1
				return a.priority-b.priority
			}).slice(0,number_of_tuners).map(function(conflict){return conflict.channel});
			next(channels);
			//
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
		delete schedules[id].priority;
		
		_save_operation(OPERATIONS.REMOVE,id,function(){
			return next && next(true);	
		},error);		
	}

	/**
	* User calls this function to set a priority value for a schedule
	*
	* @public
	* @method prioritize
	* @param {int} id the id of the schedule to be prioritized
	* @param {int} priority lower value means higher priority
	* @param {function} next the callback function
	* @param {function} error the error callback function	
	*/
	function prioritize(id,priority){
		schedules[id].priority = priority;		
	}
	
	/**
	* Process conflicts
	* @desc it does the following things
	*	1) filter out conflicts marked as removed
	*	2) filter out conflicts end at the specified time
	*	3) filter out conflicts with the same channel number(the third parameter)	 
	* @private	
	* @method _process_conflicts
	* @param {[object]} intervals 	a list of intervals need to be filtered
	* @param {int} time optional			any schedules that end on this time should be filtered
	* @return {[object]} a list of filtered schedules
	*/
	function _process_conflicts(intervals,time, channel){
		var filtered_schedules = [];
		intervals.forEach(function(interval){
			var schedule = schedules[interval.id];
			if(schedule && !schedule.removed && schedule.to!=time && schedule.channel!=channel)
				filtered_schedules.push(schedule);
		});
		/**
		* There will be no conflicts if conflicts are less than the tuners! 
		*/
		if(filtered_schedules.length<number_of_tuners)
			return [];
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
		add_array:add_array,
		query:query,
		remove:remove,
		set_tuner_count:set_tuner_count,
		get_tuner_count:get_tuner_count,
		prioritize:prioritize
	};
}
