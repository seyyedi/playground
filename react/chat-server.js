import minimist from 'minimist';
import path from 'path';
import http from 'http';
import express from 'express';
import io from 'socket.io';

import log from './gulp-log';

export default class ChatServer {
    constructor() {
        this.args = minimist(process.argv.slice(2));

        this.users = [];
    	this.lastUserId = 0;
    	this.messages = [];

        this.run = this.run.bind(this);
        this.onConnect = this.onConnect.bind(this);
        this.broadcast = this.broadcast.bind(this);
    }

    run() {
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

        var options = {
            port: this.args.port || 3000
        };

        this.http.listen(options.port, () =>
        	log.info('Server listening on *:' + options.port)
        );
    }

    onConnect(socket) {
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
            this.users.splice(this.users.indexOf(user), 1);

            if (user.active) {
                this.broadcast(user.name + ' left');
            }
        });

        socket.on('login', name => {
            user.name = name;
            user.active = true;

            log.info('User #' + user.id + ' logged in as ' + user.name);
            socket.emit('logged-in');

            for (var i = 0; i < this.messages.length; i++) {
                socket.emit('chat-message', this.messages[i]);
            }

            this.broadcast(user.name + ' joined');
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

            this.messages.push(msg);
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
}
