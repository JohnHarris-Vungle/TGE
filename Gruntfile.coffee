module.exports = (grunt) ->

	runningTasks = grunt.cli.tasks;

	# Parse game config into gameConfigContext
	vm = require("vm")

	# Load up users personal build config
	try
		homeDir = process.env.HOME || process.env.USERPROFILE
		personalConfig = grunt.file.readJSON(homeDir + '/.tresensa/buildConfig.json')
	catch e
		if !homeDir.includes("jenkins")
			grunt.fail.fatal "Failed to load buildConfig.json:\n #{e} \n Make sure you have a a personal buildConfig.json in ~/.tresensa/"
		else if !runningTasks[0].includes("slackcommit")
			personalConfig = grunt.file.readJSON("./buildConfig.json")
	try
		response = require('sync-request')("GET", "https://dashboard.tresensa.com/rest/data/creatives/", {headers: {authorization: 'Basic ' + Buffer('treautomator@gmail.com:HTML5Games').toString('base64')}, "Accept": "*/*", "Content-Type": "application/json"})
	catch e
		grunt.log.warn e

	bowerTemplate = """
	{
	  "name": "<%= sdk %>",
	  "version": "<%= version %>",
	  "authors": [
	    "Tresensa Inc."
	  ],
	  "description": "<%= description %>",
	  "main": "<%= sdk %>-<%= version %>.min.js",
	  "homepage": "http://tresensa.com",
	  "ignore": [<%= ignore %>]
	}
	"""

	check_wc_cb = (err, stdout, stderr, cb) ->
		if stdout.trim().split('\n').length != 1
			grunt.fatal "Uncommitted local or remote changes detected. Commit any local changes and/or run 'svn update' to pull remote changes."
		cb();

	check_svn_log = (err, stdout, stderr, cb) ->
		log = stdout.trim().split('\n')
		log = log.filter(Boolean)
		log.shift()
		log.pop()
		log = log.toString().split("|")
		grunt.config.set('commitRev', log[0])
		grunt.config.set('commitUser', log[1])
		grunt.config.set('commitTime', log[2])
		grunt.config.set('commitDetails', log[3])
		cb();

	grunt.initConfig
		personalConfig: personalConfig

		tge: grunt.file.readJSON("src/buildConfig.json")

		adapterFiles: []

		legalNotice: "/* Copyright (c) 2014 TreSensa, Inc. All Rights Reserved. */\n"

		clean: ["dist", "dist-docs", "dist_gzip"]

		copy:
			thirdPartyTGEProd:
				src: ["src/3rdparty/*.min.js"]
				dest: "dist/tge/3rdparty"
				flatten: true
				expand: true
			thirdPartyTGSProd:
				src: ["TGS/3rdparty/*.min.js"]
				dest: "dist/tgs/3rdparty"
				flatten: true
				expand: true
			thirdPartyTGLProd:
				src: ["TGL/3rdparty/*.min.js"]
				dest: "dist/tgl/3rdparty"
				flatten: true
				expand: true
			thirdPartyTGEQA:
				src: ["src/3rdparty/*.js"]
				dest: "dist/tge/3rdparty"
				flatten: true
				expand: true
			thirdPartyTGSQA:
				src: ["TGS/3rdparty/*.js"]
				dest: "dist/tgs/3rdparty"
				flatten: true
				expand: true
			thirdPartyTGLQA:
				src: ["TGL/3rdparty/*.js"]
				dest: "dist/tgl/3rdparty"
				flatten: true
				expand: true
			readmeTGE:
				src: ["src/README.md"]
				dest: "dist/tge"
				flatten: true
				expand: true
			readmeTGS:
				src: ["TGS/README.md"]
				dest: "dist/tgs"
				flatten: true
				expand: true
			readmeTGL:
				src: ["TGL/README.md"]
				dest: "dist/tgl"
				flatten: true
				expand: true

		concat:
			options:
				separator: ";"

			tgs:
				options:
					footer: "TGS.version = '<%= tgs.version %>';\nTGS._inline_css = '<%= tgs.inlineCss %>';"
				files:
					"dist/tgs/tgs-<%= tgs.version %>.js": "<%= tgs.files %>"
					"dist/tgs/tgs-<%= tgs.majorVersion %>.js": "<%= tgs.files %>"
			tgslite:
				options:
					footer: "TGS.version = '<%= tgs.version %>-lite';\nTGS._inline_css = '<%= tgs.inlineCss %>';"
				files:
					"dist/tgs/tgs-lite-<%= tgs.version %>.js": "<%= tgs.litefiles %>"
					"dist/tgs/tgs-lite-<%= tgs.majorVersion %>.js": "<%= tgs.litefiles %>"
			tge:
				options:
					footer: "TGE.version = '<%= tge.version %>';"
				files:
					"dist/tge/tge-<%= tge.version %>.js": "<%= tge.files %>"
					"dist/tge/tge-<%= tge.majorVersion %>.js": "<%= tge.files %>"
			tgl:
				options:
					footer: "TGL.version = '<%= tgl.version %>';"
				files:
					"dist/tgl/tgl-<%= tgl.version %>.js": "<%= tgl.files %>"
					"dist/tgl/tgl-<%= tgl.majorVersion %>.js": "<%= tgl.files %>"
			tgllite:
				options:
					footer: "TGL.version = '<%= tgl.version %>-lite';"
				files:
					"dist/tgl/tgl-lite-<%= tgl.version %>.js": "<%= tgl.litefiles %>"
					"dist/tgl/tgl-lite-<%= tgl.majorVersion %>.js": "<%= tgl.litefiles %>"
			tgl_boot:
				files:
					"dist/tgl/tgl.boot.js": ["TGL/3rdparty/head.load.js", "TGL/tgl.boot.js"]

			adapters:
				files:
					"dist/tgs/tgs-adapters-<%= tgs.version %>.js": "TGS/AdapterDefinitions.js"
					"dist/tgs/tgs-adapters-<%= tgs.majorVersion %>.js": "TGS/AdapterDefinitions.js"

			embed:
				files:
					"dist/embed.js": "embed-script/embed.js"

		uglify:
			tgs:
				options:
					banner: "/* TreSensa Game Services, TGS-SDK, Version <%= tgs.version %> */\n<%= legalNotice %>"
					footer: "TGS.version = '<%= tgs.version %>';\nTGS._inline_css = '<%= tgs.inlineCss %>';"
				files:
					"dist/tgs/tgs-<%= tgs.version %>.min.js": "<%= tgs.files %>"
					"dist/tgs/tgs-<%= tgs.majorVersion %>.min.js": "<%= tgs.files %>"
			tgslite:
				options:
					banner: "/* TreSensa Game Services, TGS-SDK, Version <%= tgs.version %> */\n<%= legalNotice %>"
					footer: "TGS.version = '<%= tgs.version %>-lite';\nTGS._inline_css = '<%= tgs.inlineCss %>';"
				files:
					"dist/tgs/tgs-lite-<%= tgs.version %>.min.js": "<%= tgs.litefiles %>"
					"dist/tgs/tgs-lite-<%= tgs.majorVersion %>.min.js": "<%= tgs.litefiles %>"
			tge:
				options:
					banner: "/* TreSensa Game Engine, TGE-SDK, Version <%= tge.version %> */\n<%= legalNotice %>"
					footer: "TGE.version = '<%= tge.version %>';"
				files:
					"dist/tge/tge-<%= tge.version %>.min.js": "<%= tge.files %>"
					"dist/tge/tge-<%= tge.majorVersion %>.min.js": "<%= tge.files %>"
			tgl:
				options:
					banner: "/* TreSensa Game Loader, TGL-SDK, Version <%= tgl.version %> */\n<%= legalNotice %>"
					footer: "TGL.version = '<%= tgl.version %>';"
				files:
					"dist/tgl/tgl-<%= tgl.version %>.min.js": "<%= tgl.files %>"
					"dist/tgl/tgl-<%= tgl.majorVersion %>.min.js": "<%= tgl.files %>"
			tgllite:
				options:
					banner: "/* TreSensa Game Loader, TGL-SDK, Version <%= tgl.version %> */\n<%= legalNotice %>"
					footer: "TGL.version = '<%= tgl.version %>-lite';"
				files:
					"dist/tgl/tgl-lite-<%= tgl.version %>.min.js": "<%= tgl.litefiles %>"
					"dist/tgl/tgl-lite-<%= tgl.majorVersion %>.min.js": "<%= tgl.litefiles %>"

			tgl_boot:
				options:
					banner: "/* TreSensa Game Loader, TGL-SDK, Version <%= tgl.version %> */\n<%= legalNotice %>"
				files:
					"dist/tgl/tgl.boot.min.js": ["TGL/3rdparty/head.load.js", "TGL/tgl.boot.js"]

			adapters:
				options:
					banner: "<%= legalNotice %>"
				files:
					"dist/tgs/tgs-adapters-<%= tgs.version %>.min.js": "TGS/AdapterDefinitions.js"
					"dist/tgs/tgs-adapters-<%= tgs.majorVersion %>.min.js": "TGS/AdapterDefinitions.js"

			embed:
				options:
					banner: "<%= legalNotice %>"
				files:
					"dist/embed.js": "embed-script/embed.js"

		less:
			options:
				cleancss: true
			tge:
				files:
					"dist/tge/css/tge-<%= tge.version %>.css": "src/style/*.less"
					"dist/tge/css/tge-<%= tge.majorVersion %>.css": "src/style/*.less"

		watch:
			options:
				livereload: 35730
			tgs:
				files: ["<%= tgs.files %>"]
				tasks: ["compile:qa:tgs", "compile:qa:tgslite"]
			tge:
				files: ["<%= tge.files %>"]
				tasks: ["compile:qa:tge"]
			tgl:
				files: ["<%= tgl.files %>"]
				tasks: ["compile:qa:tgl"]
			tgl_boot:
				files: ["TGL/tgl.boot.js"]
				tasks: ["compile:qa:tgl_boot"]
			less_tgs:
				files: ["TGS/style/*.less"]
				tasks: ["less:tgs", "readCss", "compile:qa:tgs"]
			less_tge:
				files: ["src/style/*.less"]
				tasks: ["less:tge"]
			adapters:
				files: ["<%= adapterFiles %>", "AdapterDefinitions.js"]
				tasks: ["compile:qa:adapters"]

		jsdoc:
			all:
				src: ["<%= tge.files %>", "<%= tgs.files %>", "APIDocs/templates/jsdoc3-bootstrap-tresensa/README.md"]
				options:
					destination: 'dist-docs/'
					template: 'APIDocs/templates/jsdoc3-bootstrap-tresensa/'
					# configure: "jsdoc.conf.json"


		compress:
			dist:
				options:
					mode: 'gzip'
				expand: true
				cwd: 'dist/'
				src: ['**/*.js', "**/*.css"]
				dest: 'dist_gzip/'

		karma:
			single:
				configFile: 'karma.config.coffee',
				singleRun: true

		shell:
			check_log:
				options: {stdout: true, callback: check_svn_log}
				command: 'svn log -l 1 --username <%= svnuser %> --password <%= svnpass %>'
			tag_tgs:
				options: {stdout: true, stderr: true}
				command: 'svn copy "^/trunk/TGS/" "^/tags/TGS_<%= tgs.version %>" -m "TGS <%= tgs.version %> Release"'
			tag_tge:
				options: {stdout: true, stderr: true}
				command: 'svn copy "^/trunk/src/" "^/tags/TGE_<%= tge.version %>" -m "TGE <%= tge.version %> Release"'
			tag_tgl:
				options: {stdout: true, stderr: true}
				command: 'svn copy "^/trunk/TGL/" "^/tags/TGL_<%= tgl.version %>" -m "TGL <%= tgl.version %> Release"'
			check_wc_tgs:
				options: {stdout: true, callback: check_wc_cb}
				command: 'svn status -u TGS'
			check_wc_adapters:
				options: {stdout: true, callback: check_wc_cb}
				command: 'svn status -u TGS'
			check_wc_tge:
				options: {stdout: true, callback: check_wc_cb}
				command: 'svn status -u TGE'
			check_wc_tgl:
				options: {stdout: true, callback: check_wc_cb}
				command: 'svn status -u TGL'
			docs_tgs:
				options: {stdout: true, execOptions: {cwd: "TGS/"}}
				command: 'sh document.sh'
			docs_tge:
				options: {stdout: true, execOptions: {cwd: "src/"}}
				command: 'sh document.sh'

		# Used for both PROD and QA
		aws_s3:
			options:
				accessKeyId: '<%= personalConfig.aws.accessKeyId %>'
				secretAccessKey: '<%= personalConfig.aws.secretAccessKey %>'
				uploadConcurrency: 5
				downloadConcurrency: 5
				bucket: 'sdk.tresensa.com'
				# debug: true
			tge:
				files: [{
					expand: true
					cwd: 'dist_gzip/tge'
					src: ['*.js', '3rdparty/*.js']
					dest: 'tge/'
					params:
						ContentEncoding: 'gzip'
						CacheControl: 'public, max-age=7200, s-maxage=31536000'
				}]
			tgs:
				files: [{
					expand: true
					cwd: 'dist_gzip/tgs'
					src: ['*.js', '3rdparty/*.js', "!tgs-adapters-*.js", "css/*.css"]
					dest: 'tgs/'
					params:
						ContentEncoding: 'gzip'
						CacheControl: 'public, max-age=7200, s-maxage=31536000'
				}]
			tgl:
				files: [{
					expand: true
					cwd: 'dist_gzip/tgl'
					src: ['*.js', '3rdparty/*.js']
					dest: 'tgl/'
					params:
						ContentEncoding: 'gzip'
						CacheControl: 'public, max-age=7200, s-maxage=31536000'
				}]
			adapters:
				files: [{
					expand: true
					cwd: 'dist_gzip/tgs'
					src: ['tgs-adapters-*.js', 'A*/**', 'Q*/**', 'C*/**']
					dest: 'tgs/'
					params:
						ContentEncoding: 'gzip'
						CacheControl: 'public, max-age=7200, s-maxage=31536000'
				}]
			embed:
				files: [{
					expand: true
					cwd: 'dist_gzip/'
					src: ['embed.js']
					dest: ''
					params:
						ContentEncoding: 'gzip'
						CacheControl: 'public, max-age=7200, s-maxage=31536000'
				}]
			tgs_docs:
				options: {
					bucket: "docs.tresensa.com"
				}
				files: [{
					expand: true
					cwd: 'TGS/apidocs/'
					src: ['**']
					dest: 'tgs/'
				}]
			tge_docs:
				options: {
					bucket: "docs.tresensa.com"
				}
				files: [{
					expand: true
					cwd: 'src/apidocs/'
					src: ['**']
					dest: 'tge/'
				}]

		invalidate_cloudfront:
			options:
				key: '<%= personalConfig.aws.accessKeyId %>'
				secret: '<%= personalConfig.aws.secretAccessKey %>'
				distribution: 'E3P2HLX75TCO12'
			tgs:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['tgs/*.js', 'tgs/3rdparty/*.js', '!tgs/tgs-adapters-*.js', 'tgs/css/*.css'] # only root js files, not adapters
					filter: 'isFile'
					dest: ''
				}]
			tge:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['tge/**/*.js', 'tge/**/*.css']
					filter: 'isFile'
					dest: ''
				}]
			tgl:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['tgl/**/*.js', 'tgl/**/*.css']
					filter: 'isFile'
					dest: ''
				}]
			adapters:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['tgs/tgs-adapters-*.js', 'tgs/A*/*.js', 'tgs/Q*/*.js', 'tgs/C*/*.js']
					filter: 'isFile'
					dest: ''
				}]
			embed:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['embed.js']
					dest: ''
				}]
			test:
				files: [{
					expand: true
					cwd: 'dist'
					src: ['test.txt']
					dest: ''
				}]

		updateCaches:
			s3_options:
				bucket: "games.tresensa.com"
				accessKeyId: '<%= personalConfig.aws.accessKeyId %>'
				secretAccessKey: '<%= personalConfig.aws.secretAccessKey %>'
			search:
				Bucket: '<%= updateCaches.s3_options.bucket %>'
				Delimiter: '/'
			ignored: [
				"/"
				"lib/"
				"ads/"
				"ad/"
				"dev/"
				"global_images/"
				"kik/"
				"lib/"
				"tge/"
				"tgs/"
				"wireframes/"
				"test-bucket/"
				"test-bucket2/"
			]
			concurrency: 1
		buildBowerJson:
			tge:
				sdk: "tge"
				version: "<%= tge.version %>"
				description: "Tresensa Game Engine"
		git_deploy:
			tgs_master:
				options:
					url: 'https://github.com/tresensa/tgs.git'
					branch: "master"
					message: "Release TGS version <%= tgs.version %>"
				src: ['dist/tgs/**', '!dist/tgs/A*/**', '!dist/tgs/C*/**', '!dist/tgs/Q*/**', 'dist/tgs/A0001/**', 'dist/tgs/A0002/**']
			tgs_version:
				options:
					url: "<%= git_deploy.tgs_master.options.url %>"
					branch: "<%= tgs.version %>"
					message: "<%= git_deploy.tgs_master.options.message %>"
				src: "<%= git_deploy.tgs_master.src %>"
			tge_master:
				options:
					url: 'https://github.com/tresensa/tge.git'
					branch: "master"
					message: "Release TGE version <%= tge.version %>"
				src: ['dist/tge/**']
			tge_version:
				options:
					url: "<%= git_deploy.tge_master.options.url %>"
					branch: "<%= tge.version %>"
					message: "<%= git_deploy.tge_master.options.message %>"
				src: "<%= git_deploy.tge_master.src %>"
			tgl_master:
				options:
					url: 'https://github.com/tresensa/tgl.git'
					branch: "master"
					message: "Release TGL version <%= tgl.version %>"
				src: ['dist/tgl/**']
			tgl_version:
				options:
					url: "<%= git_deploy.tgl_master.options.url %>"
					branch: "<%= tgl.version %>"
					message: "<%= git_deploy.tgl_master.options.message %>"
				src: "<%= git_deploy.tgl_master.src %>"

		prompt:
			channel:
				options:
					questions:[{
						config: 'chan'
						type: 'input'
						message: 'SLACK-CHANNEL'
						validate: (value) ->
							if value == ''
								return 'Value shouldnt be blank'
							true
					}
						{
							config: 'notes'
							type: 'input'
							message: 'CUSTOM-NOTES'
							validate: (value) ->
								if value == ''
									return 'Value shouldnt be blank'
								true
						}
					]
			auth:
				options:
					questions:[{
						config: 'auth'
						type: 'input'
						message: 'SLACKTOKEN:'
						validate: (value) ->
							if value == ''
								return 'Value shouldnt be blank - type default to use default value'
							else if value == 'default'
								return true
							true
					}]

		slack_notifier:
			build:
				options:
					token: '<%= slackToken %>'
					channel: '<%= channelName %>'
					text: 'TGE Production Deployment'
					as_user: true
					parse: 'full'
					link_names: true
					attachments:
						[
							'fallback': 'Attachment not found.'
							'color': '#36a64f'
							'pretext': ''
							'title': 'TGE <%= buildConfig.version %>'
							'title_link': 'https://play.tresensa.com/launch?placement=22&user=dashpreview&tgeVersion==<%= buildConfig.version %>'
							'text': '<%= customNotes %>'
							'image_url': 'https://solitairetripeaks.tresensa.com/banners/940x408.jpg'
							'footer': "TreSensa Automation"
							'footer_icon': "https://games.tresensa.com/game-feed/img/B0000/logo.png"
						]
					unfurl_links: true
					unfurl_media: true
			commit:
				options:
					token: 'xoxp-4255383525-4850645257-138875264803-f2bb492c55f1647d93bd6c16b922fd5b'
					channel: '#game-engineering'
					text: '*TGE COMMIT DETECTED - ' + '<%= commitRev %>*'
					as_user: true
					parse: 'full'
					link_names: true
					attachments:
						[
							'color': '#36a64f'
							'title': 'Commit detected by the following user: '
							'text': '<%= commitUser %>\n\n' + '_<%= commitDetails %>_'
							'footer': '<%= commitTime %>'
							'footer_icon': "https://games.tresensa.com/game-feed/img/B0000/logo.png"
						]
					unfurl_links: true
					unfurl_media: true

	grunt.loadNpmTasks 'grunt-prompt'
	grunt.loadNpmTasks 'grunt-slack-notifier'
	grunt.loadNpmTasks "grunt-contrib-uglify"
	grunt.loadNpmTasks "grunt-contrib-clean"
	grunt.loadNpmTasks "grunt-contrib-concat"
	grunt.loadNpmTasks "grunt-contrib-copy"
	grunt.loadNpmTasks "grunt-contrib-watch"
	grunt.loadNpmTasks "grunt-contrib-less"
	grunt.loadNpmTasks 'grunt-aws-s3'
	grunt.loadNpmTasks 'grunt-jsdoc'
	grunt.loadNpmTasks 'grunt-invalidate-cloudfront'
	grunt.loadNpmTasks 'grunt-contrib-compress'
	grunt.loadNpmTasks 'grunt-karma'
	grunt.loadNpmTasks 'grunt-shell'


	AWS = require('aws-sdk');

	# Tast to poll for cloudfront invalidations
	grunt.registerTask "waitForInvalidation", ->
		done = @async()

		cf = new AWS.CloudFront.Client(grunt.config('updateCaches.s3_options'))


		grunt.log.subhead """
			##########################################
			#                                        #
			#       DO NOT CLOSE THIS TERMINAL       #
			#                                        #
			##########################################

		"""
		grunt.log.write "Waiting for invalidation..."

		cb = (err, data) ->
			pending = data.Items.filter (item) -> item.Status is 'InProgress'
			if pending.length
				grunt.log.write(".")
				setTimeout ->
					cf.listInvalidations { DistributionId: 'E3P2HLX75TCO12' }, cb
				, 60*1000
			else
				grunt.log.write "Invalidation complete!"
				done()

		cf.listInvalidations { DistributionId: 'E3P2HLX75TCO12' }, cb

	# Task for updating all game cache.manifest files
	grunt.registerTask "updateCaches", ->
		s3 = new AWS.S3(grunt.config('updateCaches.s3_options'))
		cf = new AWS.CloudFront.Client(grunt.config('updateCaches.s3_options'))

		# Check for pending invalidations
		cf.listInvalidations { DistributionId: 'E3P2HLX75TCO12' }, (error, data) ->
			pending = data.Items.filter (item) -> item.Status is 'InProgress'
			if pending.length
				grunt.fatal "There are still (#{pending.length}) CloudFront invalidations pending on sdk.tresensa.com"
			else
				# Fetch all "folders" in bucket, and queue a download request for cache.manifest in that folder
				s3.listObjects grunt.config('updateCaches.search'), (err, list) ->
					if err then grunt.fatal("Error getting folder list: #{err.message}")
					allFolders = list.CommonPrefixes.map (key) -> key.Prefix
					filteredFolders = allFolders.filter (folder) -> !(folder in grunt.config('updateCaches.ignored'))
					downloadQueue.push filteredFolders.map (folder) ->
						Key: folder + "cache.manifest"
						Bucket: grunt.config("updateCaches.s3_options.bucket")
# games no longer have an additional gameslug bucket
#			downloadQueue.push filteredFolders.map (folder) ->
#				slug = folder.replace('/','')
#				Key: "cache.manifest"
#				Bucket: "#{slug}.tresensa.com"

		downloadQueue = grunt.util.async.queue (file, cb) ->
			grunt.util.async.waterfall [
				# Download current manifest
				(cb) -> s3.getObject file, cb
				# Update datestamp and upload
				(data, cb) ->
					# This is assuming exact text of line written by game script
					appcacheText = data.Body.toString().replace(/# Updated:.*/,"# Updated: #{new Date()} (SDK Update)")
					s3.putObject
						Body: new Buffer(appcacheText)
						Key: file.Key
						Bucket: file.Bucket
						ContentType: data.ContentType
						CacheControl: data.CacheControl or 'max-age=0, private'
					, cb
			# Any error in download/upload will land here
			], (err, result) ->
				if err?.code is "NoSuchKey"
					grunt.log.warn("#{file.Bucket}/#{file.Key} does not exist, skipping")
				else if err?.code is "NoSuchBucket"
					grunt.log.warn("#{file.Bucket} bucket does not exist, skipping")
				else if err
					grunt.log.warn("Error updating #{file.Bucket}/#{file.Key}: #{err.message}")
				else
					grunt.log.ok("Updated #{file.Bucket}/#{file.Key}")
				cb()
		, grunt.config("updateCaches.concurrency")
		downloadQueue.drain = @async()

	# Extra config for each lib
	for lib in ['tge']
		# Treat all paths as relative to root of lib
		files = grunt.config("#{lib}.files")
		files = files.map (file) -> "src/#{file}"
		console.log("Second: " + files)
		grunt.config("#{lib}.files", files)

		# Pull out major version from full version
		version = grunt.config("#{lib}.version")
		version = version.split('.')
		version.length = 2
		version = version.join('.')
		grunt.config("#{lib}.majorVersion", version)

		grunt.registerTask "compile:prod:#{lib}", ["uglify:#{lib}"]
		grunt.registerTask "compile:qa:#{lib}", ["concat:#{lib}"]

	# Generate adapters task based on AdapterDefinitions.json
	concatFiles = grunt.config("concat.adapters.files")
	minFiles = grunt.config("uglify.adapters.files")
	for own id, adapter of grunt.config("adapters")
		continue if adapter.embedded
		fileName = "TGS/partners/#{adapter.name}.js"
		concatFiles["dist/tgs/#{id}/#{id}-#{adapter.version}.js"] = [fileName]
		minFiles["dist/tgs/#{id}/#{id}-#{adapter.version}.min.js"] = [fileName]
		grunt.config.data.adapterFiles.push fileName
	grunt.config("concat.adapters.files", concatFiles)
	grunt.config("uglify.adapters.files", minFiles)

	grunt.registerTask "compile:qa:adapters", ["concat:adapters"]
	grunt.registerTask "compile:prod:adapters", ["uglify:adapters"]

	grunt.registerTask "compile:qa:embed", ["concat:embed"]
	grunt.registerTask "compile:prod:embed", ["uglify:embed"]

	grunt.registerTask "build:prod", ["clean", "copy:thirdPartyTGEProd", "copy:readmeTGE", "less", "compile:prod:tge", "buildBowerJson"]
	grunt.registerTask "build:qa", ["clean", "copy:thirdPartyTGEQA", "less", "compile:qa:tge", "compile:qa:adapters", "compile:qa:embed"]
	#grunt.registerTask "build:docs", ["clean", "jsdoc:all"]

	grunt.registerTask "readCss", ->
		grunt.log.write "Reading TGS CSS for inlining..."
		grunt.config("tgs.inlineCss", grunt.file.read(grunt.config.process("dist/tgs/css/tgs-<%= tgs.version %>.css")).replace(/'/g, "\\'"))
		grunt.log.ok()

	grunt.registerMultiTask "buildBowerJson", ->
		bowerJsonText = grunt.template.process bowerTemplate, data: this.data

		# Write out bower.json
		filename = "dist/#{this.target}/bower.json"
		grunt.log.write("Writing #{filename}...")
		grunt.file.write filename, bowerJsonText
		grunt.log.ok()

	grunt.registerTask "s3_deploy", (sdk) ->
		tasks = ["aws_s3:#{sdk}"]
		tasks.push("invalidate_cloudfront:#{sdk}")

		grunt.task.run(tasks)

	grunt.registerTask "deploy", (sdk, adapter) ->

		unless sdk and grunt.config("aws_s3.#{sdk}")
			validSdks = ["tgs", "tge", "tgl", "adapters"]
			grunt.fatal("Invalid SDK name: #{sdk}. Valid names are #{validSdks.join(', ')}")

		if sdk is "adapters" && adapter
			if !grunt.config("adapters.#{adapter}")
				grunt.fatal("Invalid adapter name: #{adapter}.")
			grunt.config "aws_s3.adapters.files.0.src", ['tgs-adapters-*.js', "#{adapter}/**"]
			grunt.config "invalidate_cloudfront.adapters.files.0.src", ['tgs/tgs-adapters-*.js', "tgs/#{adapter}/**"]


		tasks = [
			#"shell:check_wc_#{sdk}"
			"build:prod"
			"compress"
			"s3_deploy:#{sdk}"
		]

		if !adapter
			if grunt.config("git_deploy.#{sdk}_version")
				console.log("git_deploy disabled")
				#tasks.push("git_deploy:#{sdk}_version")
				#tasks.push("git_deploy:#{sdk}_master")

			if grunt.config("shell.tag_#{sdk}")
				tasks.push("shell:tag_#{sdk}")

			###
  		if grunt.config("shell.docs_#{sdk}")
				tasks.push("shell:docs_#{sdk}")
				tasks.push("aws_s3:#{sdk}_docs")###

			tasks.push("waitForInvalidation")
			#tasks.push("updateCaches")

		else if adapter is "versioned" or adapter is "qa"
			grunt.config("aws_s3.#{sdk}.files.0.src", ["#{sdk}-<%= #{sdk}.version %>.min.js", "#{sdk}-lite-<%= #{sdk}.version %>.min.js", "#{sdk}-adapters-<%= #{sdk}.version %>.min.js", "css/#{sdk}-<%= #{sdk}.version %>.css"])
			grunt.config("invalidate_cloudfront.#{sdk}.files.0.src", ["#{sdk}/#{sdk}-<%= #{sdk}.version %>.min.js", "#{sdk}/#{sdk}-lite-<%= #{sdk}.version %>.min.js", "#{sdk}/css/#{sdk}-<%= #{sdk}.version %>.css"])
			tasks.push("waitForInvalidation")
		else if sdk is "adapters"
			# do nothing special
		else
			grunt.fatal("Invalid sub-deploy '#{adapter}' for SDK '#{sdk}'")

		grunt.task.run(tasks)

	grunt.registerTask "test", ["karma:single"]
	grunt.registerTask "dev", ["build:qa", "watch"]
	grunt.registerTask "default", ["dev"]

	# Register alias task for posting to slack
	grunt.registerTask 'slack',["slackauthcheck", "prompt:channel", "slackpost"]
	grunt.registerTask 'slackcommit', (user, pass) ->
		grunt.config.set 'svnuser', user
		grunt.config.set 'svnpass', pass
		grunt.task.run "shell:check_log", "slack_notifier:commit"

	# Check for slack auth token
	grunt.registerTask 'slackauthcheck', ->
		if (personalConfig.SLACKTOKEN == undefined or personalConfig.SLACKTOKEN == "")
			grunt.log.warn "SLACKTOKEN not set - prompting and setting..."
			grunt.task.run "prompt:auth", "slackauthset"
		else
			grunt.log.ok "SLACKTOKEN found!"
			grunt.config.set "authresult", personalConfig.SLACKTOKEN
			grunt.config.set "slackToken", personalConfig.SLACKTOKEN

	# Set slackToken if no token detected
	grunt.registerTask 'slackauthset', ->
		if grunt.config.get('auth').toLowerCase() == 'default'
			grunt.log.ok "Default SLACKTOKEN requested..."
			grunt.config.set "authresult", "xoxp-4255383525-4850645257-138875264803-f2bb492c55f1647d93bd6c16b922fd5b"
		else
			grunt.log.ok "Setting SLACKTOKEN..."
			personalConfig.SLACKTOKEN = grunt.config.get('auth')
			grunt.file.write hiddenConfig, JSON.stringify(personalConfig, null, 2)
			grunt.config.set "authresult", grunt.config.get('auth')

	# Create post to jira task
	grunt.registerTask 'slackpost', ->
		buildConfig = grunt.file.readJSON("src/BuildConfig.json")
		grunt.config.set "buildConfig.version", buildConfig.version
		grunt.config.set "slackToken", grunt.config.get('authresult')
		grunt.config.set "channelName", grunt.config.get('chan')
		grunt.config.set "customNotes", grunt.config.get('notes')
		type = grunt.config.get "slackinType"
		grunt.task.run 'slack_notifier:build'

	grunt.registerTask 'slackalert', ->
		console.log("test")

	# Opener task for testing games
	grunt.registerTask 'testgames', (num) ->
		open = require('open')
		buildConfig = grunt.file.readJSON("src/BuildConfig.json")
		ver = buildConfig.version
		url = "https://play.tresensa.com/launch?placement=170&tgeVersion=" + ver + "&creative="
		finGames = []
		if !num
			# Default amount to open
			num = 10
		if response.statusCode isnt 200
			grunt.fail.fatal "\nUNEXPECTED RESPONSE CODE!\n" + response.statusCode
		else
			games = JSON.parse(response.body)
			for x in games
				if x.creativeType is 'IN_HOUSE' and !x.creativeID.includes("test")
					finGames.push(x.creativeID)
		i = 0
		tests = []
		while i < num
			temp = finGames[Math.floor(Math.random() * finGames.length)]
			if !tests.includes(temp)
				tests.push(temp)
				open(url + temp)
			i++
		