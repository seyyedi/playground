import gulp from 'gulp';
import gulpif from 'gulp-if';
import util from 'gulp-util';
import concat from 'gulp-concat';
import newer from 'gulp-newer';
import babel from 'gulp-babel';
import del from 'del';
import minimist from 'minimist';
import path from 'path';
import express from 'express';
import http from 'http';
import io from 'socket.io';

let args = minimist(process.argv.slice(2));
let log = {
    info: util.log
};

class Server {
    constructor() {
        this.users = [];
    	this.lastUserId = 0;
    	this.messages = [];

        this.onConnect = this.onConnect.bind(this);
        this.broadcast = this.broadcast.bind(this);
        this.run = this.run.bind(this);
    }

    onConnect(socket) {
        var self = this;
        var user = {
            id: this.lastUserId + 1,
            socket: socket,
            active: false
        };

        this.lastUserId = user.id;
        this.users.push(user);

        log.info('User #' + user.id + ' connected');

        socket.on('disconnect', () => {
            log.info('User #' + user.id + ' disconnected');
            self.users.splice(this.users.indexOf(user), 1);

            if (user.active) {
                self.broadcast(user.name + ' left');
            }
        });

        socket.on('login', name => {
            user.name = name;
            user.active = true;

            log.info('User #' + user.id + ' logged in as ' + user.name);
            socket.emit('logged-in');

            for (var i = 0; i < self.messages.length; i++) {
                socket.emit('chat-message', self.messages[i]);
            }

            self.broadcast(user.name + ' joined');
        });

        socket.on('chat-message', msg => {
            if (!user.active) {
                log.info('Anonymous user wants to send a chat message');
                return;
            }

            if (user.name !== msg.from) {
                log.info('Receiving message from ' + msg.from + ' in context of user ' + user.name);
                return;
            }

            self.messages.push(msg);
            socket.broadcast.emit('chat-message', msg);
        });
    }

    broadcast(text) {
		var msg = {
			from: 'Server',
			text: text
		};

		this.messages.push(msg);
		this.io.emit('chat-message', msg);
	}

    run() {
        var options = {
        	port: args.port || 3000
        };

        var app = express();

        app.getStaticFile = (url, file) =>
        	app.get(url, (req, res) =>
        		res.sendFile(
        			path.resolve(file)
        		)
        	);

        app.getStaticFile('/', 'dist/app.html');

        app.use(
        	express.static('dist')
        );

        this.http = http.Server(app);

        this.io = io(this.http);
        this.io.on('connection', this.onConnect);

        this.http.listen(options.port, () =>
        	log.info('Server listening on *:' + options.port)
        );
    }
}

var server = new Server();

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
    server.run
));

gulp.task('watch', gulp.series(
    'release',
    gulp.parallel(
        server.run,
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
