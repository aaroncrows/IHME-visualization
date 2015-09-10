var gulp = require('gulp');
var jscs = require('gulp-jscs');
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var del = require('del');
var copy = require('gulp-copy');
var sass = require('gulp-sass');
//var neat = require('node-neat').includePaths;
var webpack = require('gulp-webpack');

var paths = {
  js: './app/**/*.js',
  html: './app/index.html',
  data: './app/data/*.csv',
  sass: './app/stylesheets/*.scss',
  client: './app/js/client.js'
};

gulp.task('jscs', function() {
  return gulp.src(paths.js)
    .pipe(jscs());
});

gulp.task('jshint', function() {
  return gulp.src(paths.js)
    .pipe(jshint())
    .pipe(jshint.reporter(stylish));
});

// gulp.task('clean', function(cb) {
//   del(['./build/**/*'], cb);
// });

gulp.task('copy', function() {
  return gulp.src([paths.html, paths.data])
    .pipe(gulp.dest('./build'))
});

gulp.task('sass', function() {
  return gulp.src(paths.sass)
    .pipe(sass({
      includePaths: ['sass']//.concat(neat)
    }))
    .pipe(gulp.dest('./build/css'));
});

gulp.task('webpack', function() {
  return gulp.src(paths.client)
    .pipe(webpack(require('./webpack.config')))
    .pipe(gulp.dest('./build'));
});

gulp.task('watch', function() {
  gulp.watch([paths.js, paths.sass, paths.html], ['build'])
})

gulp.task('default', ['jscs', 'jshint', 'sass', 'webpack', 'copy']);
gulp.task('build',  ['copy', 'sass', 'webpack']);
