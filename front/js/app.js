'use strict';

/* App Module */

var dvrClient = angular.module('dvrClient', [
  'ngRoute',
  'ui.bootstrap',
  'dvrControllers',
  'dvrDirective',
  'dvrServices',
  'ui'
]);

dvrClient.config(['$routeProvider',
  function($routeProvider) {
    $routeProvider.
      when('/', {
        templateUrl: 'html/schedule.html',
        controller: 'ScheduleController'
      }).      
      otherwise({
        redirectTo: '/'
      });
  }]);
