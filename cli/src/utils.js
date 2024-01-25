import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
/** @type {(...args: string[]) => string} */
export const repoRoot = (...args) => path.join(__dirname, "../..", ...args);
