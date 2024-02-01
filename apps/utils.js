// import afterFrame from "../node_modules/afterframe/dist/afterframe.module.js";
import afterFrame from "afterframe";

export { afterFrame };

export const measureName = "duration";

const majorTask = () =>
	new Promise((resolve) => {
		window.addEventListener("message", resolve, { once: true });
		window.postMessage("major task delay", "*");
	});

/** @type {Promise<number> | null} */
let promise = null;
export function afterFrameAsync() {
	if (promise === null) {
		promise = new Promise((resolve) =>
			afterFrame((time) => {
				promise = null;
				resolve(time);
			}),
		);
	}

	return promise;
}

export async function measureMemory() {
	if ("gc" in window && "memory" in performance) {
		// Report results in MBs
		performance.mark("gc-start");
		window.gc?.();
		performance.measure("gc", "gc-start");

		// window.gc synchronously triggers one Major GC. However that MajorGC
		// asynchronously triggers additional MajorGCs until the
		// usedJSHeapSizeBefore and usedJSHeapSizeAfter are the same. Here, we'll
		// wait a moment for some (hopefully all) additional GCs to finish before
		// measuring the memory.
		await majorTask();
		performance.mark("measure-memory");
		window.usedJSHeapSize = (performance.memory?.usedJSHeapSize ?? 0) / 1e6;
	} else {
		window.usedJSHeapSize = 0;
	}
}

/** @type {(runId: string | number) => void} */
export function markRunStart(runId) {
	performance.mark(`run-${runId}-start`);
}

/** @type {Promise<void>} */
let staticPromise = Promise.resolve();
/** @type {(runId: string | number) => Promise<void>} */
export function markRunEnd(runId) {
	return staticPromise.then(() => {
		performance.mark(`run-${runId}-end`);
		performance.measure(
			`run-${runId}`,
			`run-${runId}-start`,
			`run-${runId}-end`,
		);
	});
}

/** @type {(index: number) => string} */
export function getRowIdSel(index) {
	return `tbody > tr:nth-child(${index}) > td:first-child`;
}

/** @type {(index: number) => string} */
export function getRowLinkSel(index) {
	return `tbody > tr:nth-child(${index}) > td:nth-child(2) > a`;
}

/**
 * @param {string} selector
 * @returns {Element}
 */
export function getBySelector(selector) {
	const element = document.querySelector(selector);
	if (element == null) {
		throw new Error(`Could not find element matching selector: ${selector}`);
	}

	return element;
}

/** @type {(selector: string) => void} */
export function testElement(selector) {
	const testElement = document.querySelector(selector);
	if (testElement == null) {
		throw new Error(
			"Test failed. Rendering after one paint was not successful",
		);
	}
}

/** @type {(selector: string, expectedText: string) => void} */
export function testElementText(selector, expectedText) {
	const elm = document.querySelector(selector);
	if (elm == null) {
		throw new Error("Could not find element matching selector: " + selector);
	}

	if (elm.textContent != expectedText) {
		throw new Error(
			`Element did not have expected text. Expected: '${expectedText}' Actual: '${elm.textContent}'`,
		);
	}
}

/** @type {(selector: string, expectedText: string) => void} */
export function testElementTextContains(selector, expectedText) {
	const elm = getBySelector(selector);
	if (!elm?.textContent?.includes(expectedText)) {
		throw new Error(
			`Element did not include expected text. Expected to include: '${expectedText}' Actual: '${elm.textContent}'`,
		);
	}
}

let count = 0;
const channel = new MessageChannel();
const callbacks = new Map();

/** @type {(e: MessageEvent) => void} */
channel.port1.onmessage = (e) => {
	let id = e.data;
	let fn = callbacks.get(id);
	callbacks.delete(id);
	fn();
};

/** @type {(this: MessagePort, callback: () => void) => void} */
function handleMessage(callback) {
	let id = ++count;
	callbacks.set(id, callback);
	this.postMessage(id);
}
let pm = handleMessage.bind(channel.port2);

/** @type {() => Promise<void>} */
export function nextTick() {
	return new Promise((r) => pm(r));
}

/**
 * Run a mutation n times and then
 * @param {(index: number) => unknown} mutation
 * @param {number} times
 * @returns {Promise<void>}
 */
export function mutateAndLayoutAsync(mutation, times = 1) {
	return new Promise((resolve) => {
		requestAnimationFrame(() => {
			for (let i = 0; i < times; i++) {
				mutation(i);
			}
			pm(resolve);
		});
	});
}

/** @type {(ms: number) => Promise<void>} */
export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
