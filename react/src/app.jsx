class App extends React.Component {
    constructor() {
        super();

        this.login = this.login.bind(this);
        this.sendMessage = this.sendMessage.bind(this);
        this.notify = this.notify.bind(this);
        this.render = this.render.bind(this);

        this.store = new MessageStore();
    }

    componentDidMount() {
        var self = this;

        this.socket = io();
		this.socket.on('chat-message', msg =>
			self.store.add(msg)
		);

		var user = localStorage['chat.user'];

		if (user) {
			this.login(user);
		}
	}

    componentWillUnmount() {
        this.socket = null;
    }

	login(user) {
		this.store.user = this.user = localStorage['chat.user'] = user;
		this.socket.emit('login', this.user);
	}

    sendMessage(text) {
		if (!this.user) {
			this.notify('warn', 'You must login first', 'Example: /login your-username')
			return;
		}

		var msg = {
			from: this.user,
			created: new Date().toISOString(),
			text: text
		};

		this.store.add(msg);
		this.socket.emit('chat-message', msg);
	}

	notify(type, title, text) {
		return new PNotify({
			type: type,
			title: title,
			text: text
		});
	}

    render() {
        return (
            <div>
                <div className="chat">
            		<Messages app={this}></Messages>
                    <Shell app={this}></Shell>
            	</div>
            </div>
        )
    }
}
