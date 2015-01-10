module.exports = function(grunt) {

	// Project configuration.
	grunt.initConfig({
		jshint: {
			options: {
				jshintrc: true
			},
			src: ['index.js', 'lib/**/*.js']
		}
	});

	// Load grunt plugins for modules
	grunt.loadNpmTasks('grunt-contrib-jshint');

	grunt.registerTask('default', ['jshint']);
};
