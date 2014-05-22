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
	req.scheduler.add(req.body,function(result){
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
	req.scheduler.remove(+req.params.id,function(result){
		return res.send(200);
	},function(err){
		return res.send(400,errorize(err));
	});
}
