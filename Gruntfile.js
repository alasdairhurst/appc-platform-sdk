var exec = require('child_process').exec,
	fs = require('fs'),
	path = require('path');

const BIN = './node_modules/.bin/';

module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: true
			},
			src: ['index.js', 'lib/**/*.js']
		},
		mochaTest: {
			options: {
				timeout: 40000,
				reporter: 'spec',
				bail: true,
				ignoreLeaks: false,
				globals: ['_key']
			},
			src: ['test/appc_platform_sdk_tests.js']
		},
		coverage: {
			src: ['test/appc_platform_sdk_tests.js']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-contrib-jshint');
	grunt.loadNpmTasks('grunt-mocha-test');

	// run test coverage
	grunt.registerMultiTask('coverage', 'generate test coverage report', function() {
		var done = this.async(),
			cmd = BIN + 'istanbul cover --report html ' + BIN + '_mocha -- -R min ' +
				this.filesSrc.reduce(function(p,c) { return (p || '') + ' "' + c + '" '; });

		grunt.log.debug(cmd);
		exec(cmd, function(err, stdout, stderr) {
			if (err) { grunt.fail.fatal(err); }
			if (/No coverage information was collected/.test(stderr)) {
				grunt.fail.warn('No coverage information was collected. Report not generated.');
			} else {
				grunt.log.ok('test coverage report generated to "./coverage/index.html"');
			}
			done();
		});
	});

	grunt.registerTask('cover', ['coverage']);
	grunt.registerTask('default', ['jshint', 'mochaTest']);
};
