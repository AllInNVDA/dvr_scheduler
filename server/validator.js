'use strict';

/**
* check if all parameters are NOT null
*
* @public
* @method not_null
* @return {boolean}
*/
exports.not_null = function(){
	for(var i=0 ; i<arguments.length ; i++)
		if(arguments[i] == null)	
			return false;
	return true;
}

/**
* check if all parameters are numbers
*
* @public
* @method is_number
* @return {boolean}
*/
exports.is_number = function(){
	for(var i=0 ; i<arguments.length ; i++)
		if(typeof arguments[i] !== "number")	
			return false;
	return true;
}

