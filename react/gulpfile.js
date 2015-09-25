'use strict';

var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

function _interopRequireDefault(obj) { return obj && obj.__esModule ? obj : { 'default': obj }; }

function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

var _gulp = require('gulp');

var _gulp2 = _interopRequireDefault(_gulp);

var _gulpIf = require('gulp-if');

var _gulpIf2 = _interopRequireDefault(_gulpIf);

var _gulpUtil = require('gulp-util');

var _gulpUtil2 = _interopRequireDefault(_gulpUtil);

var _gulpConcat = require('gulp-concat');

var _gulpConcat2 = _interopRequireDefault(_gulpConcat);

var _gulpNewer = require('gulp-newer');

var _gulpNewer2 = _interopRequireDefault(_gulpNewer);

var _gulpBabel = require('gulp-babel');

var _gulpBabel2 = _interopRequireDefault(_gulpBabel);

var _del = require('del');

var _del2 = _interopRequireDefault(_del);

var _minimist = require('minimist');

var _minimist2 = _interopRequireDefault(_minimist);

var _path = require('path');

var _path2 = _interopRequireDefault(_path);

var _express = require('express');

var _express2 = _interopRequireDefault(_express);

var _http = require('http');

var _http2 = _interopRequireDefault(_http);

var _socketIo = require('socket.io');

var _socketIo2 = _interopRequireDefault(_socketIo);

var args = (0, _minimist2['default'])(process.argv.slice(2));
var log = {
    info: _gulpUtil2['default'].log
};

var Server = (function () {
    function Server() {
        _classCallCheck(this, Server);

        this.users = [];
        this.lastUserId = 0;
        this.messages = [];

        this.onConnect = this.onConnect.bind(this);
        this.broadcast = this.broadcast.bind(this);
        this.run = this.run.bind(this);
    }

    _createClass(Server, [{
        key: 'onConnect',
        value: function onConnect(socket) {
            var _this = this;

            var self = this;
            var user = {
                id: this.lastUserId + 1,
                socket: socket,
                active: false
            };

            this.lastUserId = user.id;
            this.users.push(user);

            log.info('User #' + user.id + ' connected');

            socket.on('disconnect', function () {
                log.info('User #' + user.id + ' disconnected');
                self.users.splice(_this.users.indexOf(user), 1);

                if (user.active) {
                    self.broadcast(user.name + ' left');
                }
            });

            socket.on('login', function (name) {
                user.name = name;
                user.active = true;

                log.info('User #' + user.id + ' logged in as ' + user.name);
                socket.emit('logged-in');

                for (var i = 0; i < self.messages.length; i++) {
                    socket.emit('chat-message', self.messages[i]);
                }

                self.broadcast(user.name + ' joined');
            });

            socket.on('chat-message', function (msg) {
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
    }, {
        key: 'broadcast',
        value: function broadcast(text) {
            var msg = {
                from: 'Server',
                text: text
            };

            this.messages.push(msg);
            this.io.emit('chat-message', msg);
        }
    }, {
        key: 'run',
        value: function run() {
            var options = {
                port: args.port || 3000
            };

            var app = (0, _express2['default'])();

            app.getStaticFile = function (url, file) {
                return app.get(url, function (req, res) {
                    return res.sendFile(_path2['default'].resolve(file));
                });
            };

            app.getStaticFile('/', 'dist/app.html');

            app.use(_express2['default']['static']('dist'));

            this.http = _http2['default'].Server(app);

            this.io = (0, _socketIo2['default'])(this.http);
            this.io.on('connection', this.onConnect);

            this.http.listen(options.port, function () {
                return log.info('Server listening on *:' + options.port);
            });
        }
    }]);

    return Server;
})();

var server = new Server();

_gulp2['default'].task('clean', function (cb) {
    return (0, _del2['default'])(['!dist/lib', 'dist/**/*'], cb);
});

_gulp2['default'].task('build', _gulp2['default'].parallel(function () {
    return _gulp2['default'].src(['node_modules/react/dist/react-with-addons.min.js', 'node_modules/socket.io-client/socket.io.js', 'node_modules/jquery/dist/jquery.min.js', 'node_modules/classnames/index.js']).pipe(_gulp2['default'].dest('dist/lib'));
}, function () {
    return _gulp2['default'].src('lib/**/*').pipe(_gulp2['default'].dest('dist/lib'));
}, function () {
    return _gulp2['default'].src('src/**/*').pipe((0, _gulpIf2['default'])(function (f) {
        return f.path.endsWith('.jsx');
    }, (0, _gulpBabel2['default'])())).pipe(_gulp2['default'].dest('dist'));
}));

_gulp2['default'].task('rebuild', _gulp2['default'].series('clean', 'build'));

_gulp2['default'].task('bundle', _gulp2['default'].parallel(function () {
    return _gulp2['default'].src(['dist/**/*.js', '!dist/**/*.bundle.js', '!dist/lib/**/*.js']).pipe((0, _gulpConcat2['default'])('app.bundle.js')).pipe(_gulp2['default'].dest('dist'));
}, function () {
    return _gulp2['default'].src(['dist/**/*.css', '!dist/**/*.bundle.css', '!dist/lib/**/*.css']).pipe((0, _gulpConcat2['default'])('app.bundle.css')).pipe(_gulp2['default'].dest('dist'));
}));

_gulp2['default'].task('bundle-libs', _gulp2['default'].parallel(function () {
    return _gulp2['default'].src(['dist/lib/**/*.js', '!dist/lib/**/*.bundle.js']).pipe((0, _gulpConcat2['default'])('libs.bundle.js')).pipe(_gulp2['default'].dest('dist'));
}, function () {
    return _gulp2['default'].src(['dist/lib/**/*.css', '!dist/lib/**/*.bundle.css']).pipe((0, _gulpConcat2['default'])('libs.bundle.css')).pipe(_gulp2['default'].dest('dist'));
}));

_gulp2['default'].task('release', _gulp2['default'].series('rebuild', _gulp2['default'].parallel('bundle', 'bundle-libs')));

_gulp2['default'].task('serve', _gulp2['default'].series('release', server.run));

_gulp2['default'].task('watch', _gulp2['default'].series('release', _gulp2['default'].parallel(server.run, function () {
    return _gulp2['default'].watch('src/**/*', _gulp2['default'].series('build', 'bundle')).on('change', function (f) {
        return log.info('[' + f.type + '] ' + f.path);
    });
})));

_gulp2['default'].task('default', _gulp2['default'].series('watch'));

