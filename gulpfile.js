'use strict';

var gulp = require('gulp');
var orecoreTasks = require('orecore-build');

orecoreTasks('p2p', {skipBrowser: true});

gulp.task('default', ['lint', 'coverage']);
