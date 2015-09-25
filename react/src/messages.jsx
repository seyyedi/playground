class Messages extends React.Component {
    componentDidMount() {
        this.props.app.store.onChange(msg =>
            this.setState({})
        );
    }

    render() {
        var messages = this.props.app.store.messages.map(m =>
            <Message from={m.from} text={m.text} me={m.me}></Message>
        );

        return (
            <div className="messages">
                {messages}
            </div>
        )
    }
}
