class Message extends React.Component {
    render() {
        var classes = classNames('message', { me: this.props.me });

        return (
            <div className={classes}>
                <b>{this.props.from}</b> <span>{this.props.text}</span>
            </div>
        )
    }
}
