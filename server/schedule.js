/** 
## DVR Scheduler RESTful APIs
*/
'use strict';

/**
* Formats error message.
*
* @private
* @method errorize
* @param {object} err the raw error object
* @return {object} the formated error object
* @example
*   errorize("this is an error.");
*   errorize({CriticalError:"cannot find the disk"});
*/
function errorize(err) {
	console.log(err);
	return {error: err};
}


/**
* Creates a schedule.
*
* @public
* @async
* @method create
* @param {object} req the request object
* @param {object} res the response object
*/
exports.create = function(req, res){
	var func ;
	if(Array.isArray(req.body))
		func = req.scheduler.add_array;
	else
		func = req.scheduler.add;
	func(req.body,function(result){
		console.log(result);
		return res.send(200,result);
	},function(err){
		return res.send(400,errorize(err));
	});
}

/**
* Deletes a schedule by id.
*
* @public
* @async
* @method delete
* @param {object} req the request object
* @param {object} res the response object
*/
exports.delete = function(req, res){	
	// console.log(req.params.id)
	req.scheduler.remove(+req.params.id,function(result){
		return res.send(200);
	},function(err){
		return res.send(400,errorize(err));
	});
}

/**
* Returns all schedules
*
* @public
* @async
* @method show_all
* @param {object} req the request object
* @param {object} res the response object
*/
exports.show_all = function(req, res){	
	return res.send(200,req.scheduler.all());
}

/**
* Prioritize a list of schedules
*
* @public
* @async
* @method prioritize
* @param {object} req the request object
* @param {object} res the response object
*/
exports.prioritize = function(req, res){		
	req.body.forEach(function(ranking){
		console.log(ranking);
		req.scheduler.prioritize(ranking.id,ranking.priority );
	});
	return res.send(200);
}

/**
* Get tuner count
*
* @public
* @async
* @method get_tuner_count
* @param {object} req the request object
* @param {object} res the response object
*/
exports.get_tuner_count = function(req, res){
	return res.send(200, {count:req.scheduler.get_tuner_count()});	
}
