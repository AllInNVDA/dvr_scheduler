'use strict';

exports.not_null = function(){
	for(var i=0 ; i<arguments.length ; i++)
		if(arguments[i] == null)	
			return false;
	return true;
}

exports.is_number = function(){
	for(var i=0 ; i<arguments.length ; i++)
		if(typeof arguments[i] !== "number")	
			return false;
	return true;
}

