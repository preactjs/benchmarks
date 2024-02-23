import { createElement, render, Component } from "preact";

class App extends Component {
	constructor() {
		super();
		this.state = { count: 0 };
	}
	render() {
		return (
			<div>
				Count: {this.state.count}{" "}
				<button
					type="button"
					onClick={() => this.setState({ count: this.state.count + 1 })}
				>
					Add one
				</button>
			</div>
		);
	}
}

const root = document.createElement("div");
document.body.appendChild(root);
render(<App />, root);
