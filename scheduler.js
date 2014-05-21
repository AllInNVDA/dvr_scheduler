// var intervals = require('interval-query');

var intervals = new require('interval-query').Sequential(),
	validator = require("./validator");

var tasks = [] ;

exports.add = add;
exports.remove = remove;
exports.query = query;


function add(task,next,err){
	if(!validator.not_null(task)) return err("wrong arguments");
	if(!validator.not_null(task.from,task.to, task.channel)) return err("wrong arguments");
	if(!validator.is_number(task.from,task.to)) return err("wrong arguments");
	if(task.from>=task.to) return err("wrong arguments");

	intervals.queryInterval(task.from, task.to,{endpoints:false,resultFn:function(conflicts){
		var id = intervals.pushInterval(task.from, task.to);		
		tasks[id] = task;
		return next({
			id:id,
			conflicts:filter(conflicts)
		});
	}});
}

function query(time,next,err){
	if(typeof time === "number" )
		intervals.queryPoint(time,function(intervals){
			next(filter(intervals,time));
		});
	else if(time.length && time.length ===2)
		intervals.queryInterval(time[0],time[1],{endpoints:false, resultFn: function(intervals){
			next(filter(intervals));
		}});
	else
		err("wrong arguments");
}

function remove(id,next,err){
	if(!validator.not_null(id)) return err("wrong arguments");
	if(!validator.is_number(id)) return err("wrong arguments");
	if(!validator.not_null(tasks[id])) return err("wrong arguments");
	tasks[id].removed = true;
	next(true);
}

//filter does two thing:
//1) filter out deleted tasks
//2) filter out a task ends at the specified time
function filter(intervals,time){
	var ids = [];
	intervals.forEach(function(interval){
		var task = tasks[interval.id];
		if(task && !task.removed && (time==null||task.to>time))
			ids.push(interval.id);
	});
	return ids;
}