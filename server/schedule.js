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
* Creates a scheduler restfully.
*
* @public
* @async
* @method create
* @param {object} req the request object
* @param {object} res the response object
* @param {function} next the callback function
*/
exports.create = function(req, res, next){
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
* Deletes a scheduler restfully.
*
* @public
* @async
* @method delete
* @param {object} req the request object
* @param {object} res the response object
* @param {function} next the callback function
*/
exports.delete = function(req, res, next){	
	// console.log(req.params.id)
	req.scheduler.remove(+req.params.id,function(result){
		return res.send(200);
	},function(err){
		return res.send(400,errorize(err));
	});
}

exports.show_all = function(req, res, next){	
	return res.send(200,req.scheduler.all());
}

exports.prioritize = function(req, res){	
	req.body.forEach(function(ranking){
		req.scheduler.prioritize(ranking.id,ranking.priority );
	});
	return res.send(200);
}

exports.get_tuner_count = function(req, res){
	return res.send(200, {count:req.scheduler.get_tuner_count()});	
}
