var gulp = require('gulp'),
	server = require('gulp-develop-server'),
	livereload = require('gulp-livereload'),
	jshint = require('gulp-jshint'),
	jshintReporter = require('jshint-stylish'),
	watch = require('gulp-watch');

/*
 * Create variables for our project paths so we can change in one place
 */
var paths = {
	'src':['./models/**/*.js','./routes/**/*.js', 'keystone.js', 'package.json']
};


// gulp lint
gulp.task('lint', function(){
	gulp.src(paths.src)
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));

});

// gulp watcher for lint
gulp.task('watch:lint', function () {
	gulp.src(paths.src)
		.pipe(watch())
		.pipe(jshint())
		.pipe(jshint.reporter(jshintReporter));
});

// start a local http server
gulp.task('server:start', function() {
	server.listen({path: './keystone.js'});
});

// reload changed files for http server
gulp.task('server:restart', function() {
	function restart(file) {
		server.changed(function(error){
			if(!error) livereload.changed(file.path)
		});
	}

	gulp.watch(paths.src)
		.on('change', restart);
});

gulp.task('default', ['server:start', 'server:restart']);