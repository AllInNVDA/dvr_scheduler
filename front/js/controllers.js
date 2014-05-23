'use strict';

var dvrControllers = angular.module('dvrControllers', []);

dvrControllers.controller('ScheduleController', ['$route', '$q', '$scope', 'Program', 'Schedule',
  function($route,$q, $scope, Program,Schedule) {
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
  	$scope.schedules = [];
  	$scope.programs =Program.query(function(){
  		$scope.programs.forEach(function(program){
  			program.schedules.forEach(function(schedule){
  				schedule.from = Date.parse(schedule.from);
	    		schedule.to = Date.parse(schedule.to);
  			});
  		});
  		$scope.programs.sort(function(a,b){return a.channel - b.channel});    		
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
    
    $scope.delete = function(schedule){    	
    	Schedule.delete({id:schedule.id});
    	$scope.schedules.splice($scope.schedules.indexOf(schedule),1);    	
    }
    $scope.record = function(program){    	
    	var schedules = [];
    	angular.forEach(program.schedules,function(schedule){
    		if(schedule.selected && !$scope.is_scheduled(schedule,program.channel)){
    			schedules.push({from:schedule.from,to:schedule.to,channel:program.channel});
    		}    		
    	});         	
    	function resolve_conflict_async(result,schedule){
    		$scope.conflict_deferred = $q.defer();
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
			$scope.conflicts.push({
				id:result.id,
				name:program.name,
				from:schedule.from,
				to:schedule.to,
				channel:schedule.channel
			});
			console.log($scope.conflicts);
    		return $scope.conflict_deferred.promise;
    	}
    	function process_result(i,results){
    		if(i>=results.length){    			
    			$route.reload();
    			return;
    		};
    		var result = results[i];
			if(result.exist){
				alert(program.name + " is already in the schedule");
				return process_result(i+1,results);
			}				
			$scope.schedules.push({
				id: result.id,
				name: program.name,
				channel: program.channel,
				image: program.image,
				url: program.url,
				from: schedules[i].from,
				to: schedules[i].to
			});

			if(result.conflicts.length !== 0){
				var promise = resolve_conflict_async(result,schedules[i]);
				promise.then(function(){
					return process_result(i+1,results);	
				})
            }else
            	return process_result(i+1,results);
    	}
    	Schedule.post(schedules,function(results){
    		process_result(0,results);
    	});
    }
    $scope.prioritize = function(){
    	var  i = 1;
    	var priorities = $scope.conflicts.map(function(conflict){
    		return {
    			id:conflict.id,
    			priority:i++
    		}
    	})
    	// console.log(priorities);
    	Schedule.put({id:"prioritize"},priorities);    	
    	$scope.conflicts = [];
    	$scope.conflict_deferred.resolve();
    }

    $scope.has_selected_schedule = function(schedules,channel){
    	for(var i=0 ; schedules && i<schedules.length ; i++)
    		if(schedules[i].selected && !$scope.is_scheduled(schedules[i],channel))
    			return true;
    	return false;
    }

    $scope.is_scheduled = function(schedule, channel){
        for(var i=0 ;   i<$scope.schedules.length ; i++)
            if( $scope.schedules[i].channel === channel &&
                $scope.schedules[i].from === schedule.from &&
                $scope.schedules[i].to === schedule.to)
                return true;
        return false;
    }

    $scope.ended = function(time){
    	return Date.now() > time ;
    }
  }
]);

// phonecatControllers.controller('PhoneDetailCtrl', ['$scope', '$routeParams', 'Phone',
//   function($scope, $routeParams, Phone) {
//     $scope.phone = Phone.get({phoneId: $routeParams.phoneId}, function(phone) {
//       $scope.mainImageUrl = phone.images[0];
//     });

//     $scope.setImage = function(imageUrl) {
//       $scope.mainImageUrl = imageUrl;
//     }
//   }]);
