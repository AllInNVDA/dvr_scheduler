'use strict';

var dvrDirective = angular.module('dvrDirective', []);

dvrDirective.directive("modal", function() {
  return {
    restrict: "E",
    scope: {
      show: "=",
      ok: "&"
    },
    replace: true, // Replace with the template below
    transclude: true, // we want to insert custom content inside the directive
    link: function(scope, element, attrs) {
      scope.dialogStyle = {};
      if (attrs.width)
        scope.dialogStyle.width = attrs.width;
      if (attrs.height)
        scope.dialogStyle.height = attrs.height;
      scope.hide = function() {
        // scope.show = false;
      };
    },
    template: '<div class="ng-modal" ng-show="show">                          \
                <div class="ng-modal-overlay"></div>   \
                <div class="ng-modal-dialog" ng-style="dialogStyle">          \
                  <div class="ng-modal-dialog-content" ng-transclude></div>   \
                  <button class="btn btn-success pull-right" ng-click="hide();ok();">OK</button> \
                </div>                                                        \
              </div>'
  };
});