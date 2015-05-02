var gulp = require('gulp');

var rjs = require('gulp-requirejs');
var uglify = require('gulp-uglify');
var uuid = require('node-uuid');
var _ = require('underscore');
var fs = require('fs');

var htmlreplace = require('gulp-html-replace');
var waiter_template = fs.readFileSync(__dirname + '/html/app/waiter_template.html', 'utf8');
// node node_modules/gulp/bin/gulp.js html-testing
gulp.task('html-testing', function() {
    gulp.src('html/app/main_template.html')
        .pipe(htmlreplace({
            'less-script': {
                src: null,
                tpl: '<script>less = {env: "development"};</script>'
            },
            'less': {
                src: 'less/app/all.less',
                tpl: '<link rel="stylesheet/less" type="text/css" href="%s" />'
            },
            'js': {
                src: [['js/app/app.js', 'js/lib/require.js']],
                tpl: '<script data-main="%s" src="%s"></script>'
            },
            'js-less': {
                src: 'js/lib/less.js'
            },
            'waiter': {
                src: '',
                tpl: waiter_template
            }
        }))
        .pipe(rename('debug.html'))
        .pipe(gulp.dest('./'));
});

var rimraf = require('gulp-rimraf');

gulp.task('clean-js', function() {
    return gulp.src('./content/js/dist/*.js', { read: false })
        .pipe(rimraf());
});

gulp.task('clean-css', function() {
    return gulp.src('./content/css/dist/*.css', { read: false })
        .pipe(rimraf());
});

gulp.task('uniq-json', function(cb) {
    var dirPath = './content/json/app/';
    /*
     fs.readdir(dirPath, function(err, files){
     if (err) throw err;
     var c = 0;
     files.forEach(function(file){
     c++;
     fs.readFile(dirPath+file, 'utf-8', function(err, file){
     if (err) throw err;
     var json = JSON.parse(file);
     if (0 === --c) {
     console.log('DONE');
     cb();
     }
     });
     });
     });
     */
    var filePath = 'collection_config.json';
    var uuid1 = uuid.v1();
    fs.readFile(dirPath + filePath, 'utf-8', function(err, file){
        if (err) throw err;
        var configs = JSON.parse(file);
        var changed = false;
        _.each(configs, function(config) {
            if (config.store === 'pageload') {
                changed = true;
                var index = config.url.indexOf('?');
                if (index >= 0) {
                    config.url = config.url.substring(0, index);
                }
                config.url += '?' + uuid1;
            }
        });

        if (changed) {
            fs.writeFile(dirPath + filePath, JSON.stringify(configs), function (err) {
                if (err) throw err;
                cb();
            });
        } else {
            cb();
        }
    });
});

var lessToCSS = require('gulp-less');
var rename = require("gulp-rename");

gulp.task('production', ['clean-js', 'clean-css', 'uniq-json'], function() {
    var uuid1 = uuid.v1();
    var allJSname = 'all.js';
    var allCSSname = 'all.css';

    var config = {};
    config.mainConfigFile = 'content/js/app/require_manager.js';
    config.out = allJSname;
    config.name = 'app/require_manager';
    config.include = ['lib/almond.js'];
    config.findNestedDependencies = true;
    config.baseUrl = 'content/js/';

    rjs(config)
        //.pipe(uglify())
        .pipe(gulp.dest('content/js/dist/'));

    gulp.src('content/less/app/all.less')
        .pipe(lessToCSS())
        //.pipe(minifyCSS({
        //    keepSpecialComments: 0
        //}))
        .pipe(rename(allCSSname))
        .pipe(gulp.dest('./content/css/dist/'));

    gulp.src('content/html/app/main.html')
        .pipe(htmlreplace({
            'less': {
                src: [['content/css/dist/' + allCSSname, uuid1]],
                tpl: '<link type="text/css" rel="stylesheet" href="%s?%s" />'
            },
            'js': {
                src: [['content/js/dist/' + allJSname, uuid1]],
                tpl: '<script src="%s?%s"></script>'
            }
        }))
        .pipe(rename('index.html'))
        .pipe(gulp.dest('content/'));
});