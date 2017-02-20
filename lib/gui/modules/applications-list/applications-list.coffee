define (require, exports, module) ->

	angular = require('angular')

	applicationsListDirective = require('./directives/applications-list-directive')
	createApplicationDirective = require('./directives/create-application-directive')

	angular.module('applications-list', [])
	.directive('applicationsList', applicationsListDirective)
	.directive('createApplication', createApplicationDirective)
