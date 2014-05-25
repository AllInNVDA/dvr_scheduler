'use strict';

var dvrControllers = angular.module('dvrControllers', []);

dvrControllers.controller('ScheduleController', ['$timeout','$route', '$q', '$scope', 'Program', 'Schedule',
  function($timeout, $route,$q, $scope, Program,Schedule) {
    var conflict_deferred;
  	/**
    * Find a program by a channel id, start time and end time
    *
    * @private    
    * @method find_program
    * @param {int} channel channel id
    * @param {int} from start time
    * @param {int} to end time
    * @return {[object,object]} [program,schedule]
    */
    function find_program(channel,from,to){
  		for(var j=0 ; j<$scope.programs.length; j ++){    				    				
  			var program = $scope.programs[j];
			if(program.channel === channel){
				var schedules = program.schedules;
				for(var k=0 ; k<schedules.length ; k++){	    						    					
					var schedule = schedules[k] ;	    					
					if(schedule.from === from && schedule.to === to){
                        return [program,schedule];
					}
				}
			}
		}    				
  	}

    $scope.tuner_count = Schedule.get({id:"tuner_count"});

    /**
    * A list of schedules to be recorded
    */
  	$scope.schedules = [];

    /**
    * A list of TV programs to be aired
    */
  	$scope.programs =Program.query(function(){        
  		$scope.programs.forEach(function(program){
  			program.schedules.forEach(function(schedule){
                /**
                * For readability, dates in the json file are represented by strings.                
                */
  				schedule.from = Date.parse(schedule.from);
	    		schedule.to = Date.parse(schedule.to);
  			});
  		});
    	var raw_schedules = Schedule.query(function(){    		    		
    		for(var i=0  ;i<raw_schedules.length ; i++){
    			var pair = find_program(raw_schedules[i].channel,raw_schedules[i].from,raw_schedules[i].to);
				var program = pair[0];
				var schedule = pair[1];
				 $scope.schedules.push({
					id: raw_schedules[i].id,
					name: program.name,
					channel: program.channel,
					image: program.image,
					url: program.url,
					from: schedule.from,
					to: schedule.to,
					priority:raw_schedules[i].priority
				});    			
    		}  
	    });		
    });
    
    /**
    * Delete a schedule
    *
    * @public
    * @method delete
    * @param {object} schedule schedule object
    */
    $scope.delete = function(schedule){    	
    	Schedule.delete({id:schedule.id});
    	$scope.schedules.splice($scope.schedules.indexOf(schedule),1);    	
    }

    /**
    * Schedule recordings for a program
    *
    * @public
    * @method record
    * @param {object} program program object
    */
    $scope.record = function(program){    	
    	var schedules = [];
        /**
        * Get seleted proram schedules
        */  
    	angular.forEach(program.schedules,function(schedule){
    		if(schedule.selected && !$scope.is_scheduled(schedule,program.channel)){
    			schedules.push({from:schedule.from,to:schedule.to,channel:program.channel});
    		}    		
    	});         	
    	/**
        * Add schedules to the server(scheduler). 
        * The server will return an id and conflicts for each newly created schedule.
        */  
    	Schedule.post(schedules,function(results){
    		process_result(0,results);
    	});

        /**
        * Schedule recordings for a program
        *
        * @private
        * @recursive
        * @method process_result
        * @param {int} i to process the i-th result
        * @param {[object]} results results returned by the server
        */
        function process_result(i,results){
            if(i>=results.length){
                /**
                * a lazy way to have client's data synced with the server 
                * @todo: do not use reload()
                */              
                $route.reload();
                return;
            };
            var result = results[i];
            if(result.exist){
                /**
                * @todo: replace alert() with a better warning UI
                */     
                alert(program.name + " is already in the schedule");
                return process_result(i+1,results);
            }               

            if(result.conflicts.length !== 0){
                /**
                * If the result contains conflicts, ask the user to prioritize the conflicts in a modal.
                * Process the next result only after the current one's conflicts are resoved, that is, a promise is required.
                */
                var promise = resolve_conflict_async(result,schedules[i]);
                promise.then(function(){
                    /**
                    * without timeout, the user may not realize moving to the next conflict
                    */
                    return $timeout(function(){
                        process_result(i+1,results);
                    },200)  
                })
            }else
                return process_result(i+1,results);
        }
        /**
        * Schedule recordings for a program
        *
        * @private
        * @async
        * @method resolve_conflict_async
        * @param {object} result the result of creating a schedule
        * @param {object} schedule the created schedule
        * @return {object} a promise
        */
        function resolve_conflict_async(result,schedule){
            conflict_deferred = $q.defer();
            $scope.conflicts = result.conflicts.map(function(conflict){
                var pair = find_program(conflict.channel,conflict.from,conflict.to);
                var program = pair[0];
                var schedule = pair[1];
                return {
                    id:conflict.id,
                    name:program.name,
                    from:schedule.from,
                    to:schedule.to,
                    channel:program.channel 
                }
            });            
            /**
            * Add the newly created schedule to the conflicts
            */        
            $scope.conflicts.push({
                id:result.id,
                name:program.name,
                from:schedule.from,
                to:schedule.to,
                channel:schedule.channel
            });
            console.log($scope.conflicts);
            return conflict_deferred.promise;
        }
        
    }

    /**
    * Prioritize a list of conflicts
    *
    * @public
    * @method prioritize
    */
    $scope.prioritize = function(){
    	var  i = 1;
    	var priorities = $scope.conflicts.map(function(conflict){
    		return {
    			id:conflict.id,
    			priority:i++
    		}
    	})
    	Schedule.put({id:"prioritize"},priorities);    	
    	$scope.conflicts = [];
    	conflict_deferred.resolve();
    }

    /**
    * To check if a program has some recording schedules set by the user.
    *
    * @public
    * @method has_selected_schedule
    * @param {[object]} schedules a list of schedules 
    * @param {int} channel the channel id
    */
    $scope.has_selected_schedule = function(schedules,channel){
    	for(var i=0 ; schedules && i<schedules.length ; i++)
    		if(schedules[i].selected && !$scope.is_scheduled(schedules[i],channel))
    			return true;
    	return false;
    }

    /**
    * To check if an episode has been scheduled to be recorded.
    *
    * @public
    * @param {object} schedule a schedule
    * @param {int} channel the channel id
    * @method is_scheduled
    */
    $scope.is_scheduled = function(schedule, channel){
        for(var i=0 ;   i<$scope.schedules.length ; i++)
            if( $scope.schedules[i].channel === channel &&
                $scope.schedules[i].from === schedule.from &&
                $scope.schedules[i].to === schedule.to)
                return true;
        return false;
    }

    /**
    * To check if a time is earlier than the current time.
    *
    * @public
    * @param {int} time a time value
    * @method ended
    */
    $scope.ended = function(time){
    	return Date.now() > time ;
    }
  }
]);