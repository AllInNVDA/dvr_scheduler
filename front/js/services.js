'use strict';

var dvrServices = angular.module('dvrServices', ['ngResource']);

dvrServices.factory('Program', ['$resource',
  function($resource){
    return $resource('data/programs.json', {}, {
      query: {method:'GET',  isArray:true}
    });
}]);

dvrServices.factory('Schedule', ['$resource',
  function($resource){
    return $resource('schedules' + '/:id', {id: '@id'}, {
      query: {method:'GET',  isArray:true},
      post: {method:'POST',  isArray:true},      
      put: {method:'PUT'}
    });
}]);