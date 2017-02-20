define (require, exports, module) ->

	_ = require 'lodash'

	module.exports = [
		'SpinnerService'
		'NoticeBoardService'
		'ApplicationModelService'
		'DeviceService'
		'EventLogService'
		'AuthUserService'
	(
		SpinnerService,
		NoticeBoardService,
		ApplicationModelService,
		DeviceService,
		EventLogService,
		AuthUserService
	) ->

		restrict: 'E'
		replace: true
		template: require('../templates/applications-list.tpl.html')
		scope:
			parentApplication: '=?'

		link: (scope) ->
			scope.loaded = false

			scope.NOTICE_BOARD_NAME = NOTICE_BOARD_NAME = 'applications-list'
			publishToBoard = (message) ->
				NoticeBoardService.publish(message, NOTICE_BOARD_NAME)

			isDependentApp = !!scope.parentApplication

			scope.isAppOwnedByCurrentUser = ApplicationModelService.isOwnedByCurrentUser

			if not isDependentApp
				getData = ->
					appsOptions =
						select: [ 'id', 'app_name', 'device_type', 'commit' ]
						expand:
							user: $select: [ 'id', 'username' ]
							device: $select: DeviceService.statusRequiredFields
							application: $select: [ 'id' ]

					ApplicationModelService
					.getAllDirectlyAccessible(null, appsOptions)

			else
				getData = ->
					appsOptions =
						expand:
							user: $select: [ 'id', 'username' ]
							device: $select: DeviceService.statusRequiredFields

					appsFilter = { application: scope.parentApplication.id }

					ApplicationModelService
					.find(appsFilter, appsOptions)

			getData()
			.then (applications) ->
				user = AuthUserService.user

				scope.apps = _.map applications, (app) ->
					app.device_type_info = DeviceService.getTypeByName(app.device_type)

					# TODO: expansion doesn't work so we have to separately
					# check if the app has some dependent apps
					if not isDependentApp
						ApplicationModelService.getDependent(app.id, select: [ 'id' ])
						.then (dependentApps) ->
							app.has_dependent = !!dependentApps.length

					return app

				scope.myOwnApps = _.filter applications, (app) ->
					app.user[0].id is user.id

				scope.loaded = true
			.catch (e) ->
				scope.apps = []
				publishToBoard(e.message or e)

	]
