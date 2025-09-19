import { getNoError } from './getNoError'

let logLevel = getNoError<number>(0, () =>
	JSON.parse(sessionStorage['LOG_LEVEL']),
)

;(globalThis as any).setLogLevel = (it: number) => {
	sessionStorage['LOG_LEVEL'] = JSON.stringify(it)
	logLevel = it
}
;(globalThis as any).getLogLevel = () => logLevel

export function log0(...rest: unknown[]) {
	if (logLevel >= 0) {
		console.log(...rest)
	}
}
export function log1(...rest: unknown[]) {
	if (logLevel >= 1) {
		console.log(...rest)
	}
}
export function log1Group(...rest: unknown[]) {
	if (logLevel >= 1) {
		console.group(...rest)
	}
}
export function log1GroupEnd() {
	if (logLevel >= 1) {
		console.groupEnd()
	}
}
export function log2(...rest: unknown[]) {
	if (logLevel >= 2) {
		console.log(...rest)
	}
}
export function log2Group(...rest: unknown[]) {
	if (logLevel >= 2) {
		console.group(...rest)
	}
}
export function log2GroupEnd() {
	if (logLevel >= 2) {
		console.groupEnd()
	}
}
export function log3(...rest: unknown[]) {
	if (logLevel >= 3) {
		console.log(...rest)
	}
}
