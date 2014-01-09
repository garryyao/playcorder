/*global module:false*/
module.exports = function(grunt) {

	var path = require('path');
	require("load-grunt-tasks")(grunt);
	grunt.registerTask("default",
		["clean:dist", "copy:dist", "requirejs-transformconfig:dist", "requirejs", "concat", "processhtml", "clean:after-dist"]);
	grunt.registerTask("release", ["default", "clean:release", "copy:release"]);

	function includeSource(patterns) {
		return grunt.util._.map(grunt.file.expand(patterns), function(file) {
			return path.join('<%= pkg.name %>', file.replace(/\.js$/, ''));
		});
	}

	// Project configuration.
	grunt.initConfig({
		pkg: grunt.file.readJSON('package.json'),
		bowerDir: 'bower_components',
		clean: {
			dist: "dist/",
			"after-dist": ["dist/<%= bowerDir %>", "dist/main.js"],
			release: "release/"
		},
		copy: {
			dist: {
				files: [
					{
						'dist/': ['widget/**/*', 'main.js']
					},
					{
						'dist/': 'bower_components/**/*'
					}
				]
			},
			"release": {
				files: {
					"release/<%= pkg.version %>/": "dist/**/*"
				}
			}
		},
		"requirejs-transformconfig": {
			options: {
				// Some transformation goes here.
				transform: function(config) {
					// Remove all packages;
					delete config.packages;
					return config;
				}
			},
			dist: {
				files: [
					{
						'dist/main.js': 'main.js'
					}
				]
			}
		},
		requirejs: {
			dist: {
				options: {
					baseUrl: 'dist',
					mainConfigFile: 'main.js',
					out: "dist/nodeps.js",
					include: includeSource(["widget/**/*.js", "main.js"]),
					optimize: "none"
				}
			}
		},
		concat: {
			dist: {
				src: ['bower_components/requirejs/require.js', 'dist/nodeps.js'],
				dest: 'dist/nodeps.js'
			}
		},
		uglify: {
			dist: {
				src: [ , "dist/nodeps.js"],
				dest: "dist/nodeps.min.js"
			}
		},
		processhtml: {
			options: {
				process: true
			},
			dist: {
				files: {
					"dist/index.html": "index.html"
				}
			}
		}
	});
};
