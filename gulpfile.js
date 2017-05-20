var gulp = require('gulp'),
    gutil = require('gulp-util'),
    plugins = require('gulp-load-plugins')(),
    notify = require('gulp-notify'),
    path = require('path'),
    es = require('event-stream'),
    webpack = require('webpack'),
    webpackStream = require('webpack-stream');

// require("babel-core").transform("code", {
//   plugins: ["syntax-async-functions"]
// });

/**
 * Handle errors for a plugin by generating a gulp-notify notification and
 * logging to console based on current gulp-util environment setting.
 *
 * @param {string} taskName Name of task, used in notification title
 */
function handleError(taskName) {
    return notify.onError({
        title: 'gulp ' + taskName + ' Task ' + (gutil.env.dev ? 'Warning' : 'Failed'),
        emitError: !gutil.env.dev // Log errors as warnings without ending stream
    });
}

gulp.task('js', function() {
    var tasks = ['./main.js'].map(function(file) {
        return gulp.src(file)
            .pipe(gutil.env.dev ? plugins.sourcemaps.init() : gutil.noop())
            .pipe(webpackStream({
                context: path.dirname(file),
                output: {
                    filename: path.basename(file)
                },
                module: {
                    loaders: [
                        {
                            test: /.*\.js$/,
                            loader: 'babel-loader',
                            includes: [ 'src/' ],
                            query: {
                                plugins: ['syntax-async-functions', 'transform-regenerator'],
                                presets: ['es2015']
                            }
                        }
                    ]
                },
                resolveLoader: {
                    modulesDirectories: [ path.join(__dirname, '/node_modules') ]
                },
                devtool: gutil.env.dev ? 'eval-source-map' : ''
            }))
            .on('error', handleError('js'))
            .pipe(gutil.env.dev ? plugins.sourcemaps.write() : gutil.noop())
            .pipe(plugins.rename({ extname: '.min.js' }))
            .pipe(gulp.dest('./build/assets/js/'))
            .pipe(gutil.env.dev ? plugins.livereload() : gutil.noop());
    });

    return es.merge.apply(null, tasks);
});

gulp.task('build', ['js']);

/**
 * gulp watch
 *
 * Run build tasks and watch for subsequent changes.
 */
gulp.task('watch', ['build'], function() {
    gulp.watch('./src/js/**/*.js', ['js']);
    gulp.watch('./main.js', ['js']);
});

gulp.task('default', ['watch']);