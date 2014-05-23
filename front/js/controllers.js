'use strict';

var dvrControllers = angular.module('dvrControllers', []);

dvrControllers.controller('ScheduleController', ['$scope', 'Program', 'Schedule',
  function($scope, Program,Schedule) {
    $scope.tuner_count = Schedule.get({id:"tuner_count"});
  	$scope.schedules = [];
  	$scope.programs =Program.query(function(){
  		$scope.programs.forEach(function(program){
  			program.schedules.forEach(function(schedule){
  				schedule.from = Date.parse(schedule.from);
	    		schedule.to = Date.parse(schedule.to);
  			});
  		});
    	var raw_schedules = Schedule.query(function(){    		
    		$scope.programs.sort(function(a,b){return a.channel - b.channel});    		
    		for(var i=0  ;i<raw_schedules.length ; i++){
    			for(var j=0 ; j<$scope.programs.length && raw_schedules[i].channel >= $scope.programs[j].channel  ; j ++){    				    				
	    			if(raw_schedules[i].channel === $scope.programs[j].channel){
	    				var schedules = $scope.programs[j].schedules;
	    				for(var k=0 ; k<schedules.length ; k++){	    						    					
	    					var schedule = schedules[k] ;	    					
	    					if(schedule.from === raw_schedules[i].from && schedule.to === raw_schedules[i].to){
                                schedule.selected = true;
                                $scope.schedules.push({
	    							id: raw_schedules[i].id,
	    							name: $scope.programs[j].name,
	    							channel: $scope.programs[j].channel,
	    							image: $scope.programs[j].image,
	    							url: $scope.programs[j].url,
	    							from: schedule.from,
	    							to: schedule.to
	    						});
	    						break;
	    					}
	    				}
	    			}
	    		}    				
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
    	Schedule.post(schedules,function(results){
    		for(var i=0 ; i<results.length ; i++){
    			var result = results[i];
    			if(result.exist)
    				alert(program.name + " is already in the schedule");
    			else if(result.conflicts.length === 0){
    				$scope.schedules.push({
						id: result.id,
						name: program.name,
						channel: program.channel,
						image: program.image,
						url: program.url,
						from: schedules[i].from,
						to: schedules[i].to
					});
    			}else{
                    $scope.has_conflicts = true;
                }
    		}    		
    	});
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
