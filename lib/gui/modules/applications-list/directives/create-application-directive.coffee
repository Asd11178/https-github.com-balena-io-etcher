define (require, exports, module) ->

	_ = require('lodash')

	module.exports = [
		'helpers'
		'SpinnerService'
		'NoticeBoardService'
		'ApplicationModelService'
		'DeviceService'
		'EventLogService'
	(
		helpers,
		SpinnerService,
		NoticeBoardService,
		ApplicationModelService,
		DeviceService,
		EventLogService
	) ->

		restrict: 'E'
		replace: true
		template: require('../templates/create-application.tpl.html')
		scope:
			parentApplication: '=?'
			existingApplications: '='
			focusForm: '=?'
			noticeBoard: '@'

		link: (scope) ->

			NOTICE_BOARD_NAME = scope.noticeBoard
			publishToBoard = (message) ->
				NoticeBoardService.publish(message, NOTICE_BOARD_NAME)

			isDependentApp = !!scope.parentApplication

			scope.deviceTypeDisplayName = DeviceService.getDisplayName

			if not isDependentApp
				getSupportedDevices = DeviceService.getAvailableDevices()
			else
				getSupportedDevices = DeviceService.getAvailableDependentDevices()

			getSupportedDevices.then (availableDevices) ->
				scope.newApplication =
					deviceType: DeviceService.getDefaultDeviceType(availableDevices)

				scope.deviceTypeOptions = _(availableDevices)
					.keyBy('slug')
					.mapValues('name')
					.value()

			goToApp = (id) ->
				helpers.stateGo('dashboard.application', appId: id)

			scope.add = ->
				{ name, deviceType } = scope.newApplication

				SpinnerService.show("Creating application #{name}...")

				attrs = if isDependentApp
					application: scope.parentApplication.id
				else null

				ApplicationModelService.create(name, deviceType, attrs)
				.then (id) ->
					EventLogService.application.create(null, id)
					return id
				.then(goToApp)
				.catch(publishToBoard)
				.finally ->
					SpinnerService.hide()
					scope.newApplication.name = ''

			scope.hasError = (field) ->
				return not _.isEmpty(field.$error)

			scope.canSubmit = (form) ->
				return form and not form.$pristine and not form.$invalid

			scope.$watch 'existingApplications', ->
				# revalidate the form if it was loaded and filled before the
				# existing apps list is updated
				scope.newAppForm?.applicationName?.$validate()

	]
