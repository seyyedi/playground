class Hello extends React.Component {
	handleChange() {
		console.log('change');
	}

	render() {
		return <div>
			<div>Hello {this.props.name}!</div>
			<div>{new Date().getTime()}</div>
		</div>
	}
}
