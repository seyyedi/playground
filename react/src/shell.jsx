class Shell extends React.Component {
    constructor() {
        super();
        this.onKeyUp = this.onKeyUp.bind(this);
    }

    onKeyUp(e) {
        if (!e.ctrlKey && !e.shiftKey && e.keyCode === 13) {
    		this.props.app.sendMessage(e.target.value);
            e.target.value = '';
        }
    }

    render() {
        return (
            <div className="shell">
                <textarea onKeyUp={this.onKeyUp}></textarea>
            </div>
        )
    }
}
