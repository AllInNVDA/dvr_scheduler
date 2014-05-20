var intervals = require('interval-query');

var tasks = new intervals.Sequential;

exports.add = add;
exports.query = query;


function add(start,end,task,next){
	tasks.queryInterval(start, end,{resultFn:function(conflicts){
		tasks.pushInterval(start, end);
		next(conflicts);
	}});
	
	
}

function query(time,err,next){
	if(typeof time === "number" )
		tasks.queryPoint(time,next);
	else if(time.length && time.length ===2)
		tasks.queryInterval(time[0],time[1],{ resultFn: next});
	else
		err("wrong parameters");

}