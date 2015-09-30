import gulp from 'gulp';
import HttpServer from './httpServer';

gulp.task('serve', () => {
    new HttpServer()
        .static('^/$', 'app/index.html')
        .static('^/jspm_packages/(.+)$', 'jspm_packages')
        .static('^/(config\.js)$', '')
        .static('^/(.+)$', 'app')
        .run();
});

gulp.task('default', gulp.series(
    'serve'
));
