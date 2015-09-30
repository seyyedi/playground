import gulp from 'gulp';
import gulpif from 'gulp-if';
import concat from 'gulp-concat';
import babel from 'gulp-babel';
import del from 'del';

import log from './gulp-log';
import ChatServer from './chat-server';

gulp.task('clean', cb =>
    del(['!dist/lib', 'dist/**/*'], cb)
);

gulp.task('build', gulp.parallel(
    () => gulp
        .src([
            'node_modules/react/dist/react-with-addons.min.js',
            'node_modules/socket.io-client/socket.io.js',
            'node_modules/jquery/dist/jquery.min.js',
            'node_modules/classnames/index.js'
        ])
        .pipe(gulp.dest('dist/lib')),
    () => gulp
        .src('lib/**/*')
        .pipe(gulp.dest('dist/lib')),
    () => gulp
        .src('src/**/*')
        .pipe(gulpif(f => f.path.endsWith('.jsx'),
            babel()
        ))
        .pipe(gulp.dest('dist'))
));

gulp.task('rebuild', gulp.series(
    'clean',
    'build'
));

gulp.task('bundle', gulp.parallel(
    () => gulp
        .src(['dist/**/*.js', '!dist/**/*.bundle.js', '!dist/lib/**/*.js'])
        .pipe(concat('app.bundle.js'))
        .pipe(gulp.dest('dist')),
    () => gulp
        .src(['dist/**/*.css', '!dist/**/*.bundle.css', '!dist/lib/**/*.css'])
        .pipe(concat('app.bundle.css'))
        .pipe(gulp.dest('dist'))
));

gulp.task('bundle-libs', gulp.parallel(
    () => gulp
        .src(['dist/lib/**/*.js', '!dist/lib/**/*.bundle.js'])
        .pipe(concat('libs.bundle.js'))
        .pipe(gulp.dest('dist')),
    () => gulp
        .src(['dist/lib/**/*.css', '!dist/lib/**/*.bundle.css'])
        .pipe(concat('libs.bundle.css'))
        .pipe(gulp.dest('dist'))
));

gulp.task('release', gulp.series(
    'rebuild',
    gulp.parallel(
        'bundle',
        'bundle-libs'
    )
));

gulp.task('serve', gulp.series(
    'release',
    new ChatServer().run
));

gulp.task('watch', gulp.series(
    'release',
    gulp.parallel(
        new ChatServer().run,
        () => gulp
            .watch('src/**/*',
                gulp.series('build', 'bundle')
            )
            .on('change', f => log.info('[' + f.type + '] ' + f.path))
    )
));

gulp.task('default', gulp.series(
    'watch'
));
