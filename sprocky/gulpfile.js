var gulp = require('gulp');
var util = require('gulp-util');

gulp.task('impress', function(cb) {
    util.log('Ich bin der geilste!');
    setTimeout(function() {
        util.log('Moin Moin');
        cb();
    }, 1000);
});

gulp.task('be-humble', function(cb) {
    util.log('Ich bin der geilste, kann aber vielleicht noch geiler werden!');
    cb();
});

gulp.task('queue', gulp.parallel(
    function queueOne(cb) {
        util.log('Ist da');
        setTimeout(cb, 3000)
    },
    function queueTwo(cb) {
        util.log('Queue 1');
        setTimeout(cb, 5000)
    }
));

gulp.task('greet', gulp.series(
    'impress',
    'queue',
    'be-humble',
    function sprocky(cb) {
        util.log('Hallo ihr geilen Säcke.');
        cb();
    }
));
