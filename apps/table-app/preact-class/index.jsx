import { createElement, render } from "preact";
const root = document.createElement("div");
document.body.appendChild(root);
render(<div>Hello World!</div>, root);
