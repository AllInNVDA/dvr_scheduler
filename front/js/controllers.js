'use strict';

var dvrControllers = angular.module('dvrControllers', []);

dvrControllers.controller('ScheduleController', ['$scope', 'Program', 'Schedule',
  function($scope, Program,Schedule) {
  	$scope.schedules = [];
  	$scope.programs =Program.query(function(){
  		$scope.programs.forEach(function(program){
  			program.schedules.forEach(function(schedule){
  				schedule[0] = Date.parse(schedule[0]);
	    		schedule[1] = Date.parse(schedule[1]);
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
	    					if(schedule[0] === raw_schedules[i].from && schedule[1] === raw_schedules[i].to){
	    						schedule.scheduled = true;
	    						$scope.schedules.push({
	    							id: raw_schedules[i].id,
	    							name: $scope.programs[j].name,
	    							channel: $scope.programs[j].channel,
	    							image: $scope.programs[j].image,
	    							url: $scope.programs[j].url,
	    							from: schedule[0],
	    							to: schedule[1]
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
    		if(schedule.selected){
    			schedules.push({from:schedule[0],to:schedule[1],channel:program.channel});
    		}    		
    	});     	
    	Schedule.post(schedules,function(results){
    		for(var i=0 ; i<results.length ; i++){
    			var result = results[i];
    			if(result.exist)
    				alert(program.name + " is already in the schedule");
    			if(result.conflicts.length === 0 && !result.exist){
    				$scope.schedules.push({
						id: result.id,
						name: program.name,
						channel: program.channel,
						image: program.image,
						url: program.url,
						from: schedules[i].from,
						to: schedules[i].to
					});
    			}
    		}    		
    	});
    }

    $scope.has_selected_schedule = function(schedules){
    	for(var i=0 ; schedules && i<schedules.length ; i++)
    		if(schedules[i].selected)
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
