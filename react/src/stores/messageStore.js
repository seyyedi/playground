class MessageStore {
    constructor() {
        this.messages = [];
        this.onChangeHandlers = [];
    }

	add(msg) {
        msg.me = msg.from === this.user;
        this.messages.push(msg);

        this.onChangeHandlers.forEach(cb =>
            cb(msg)
        );
	}

    onChange(cb) {
        this.onChangeHandlers.push(cb);
    }
}
