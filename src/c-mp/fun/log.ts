import { getGlobalCmp } from './getGlobalCmp'
import { getNoError } from './getNoError'

const LEVEL = '⁝ '

export let logIndent = LEVEL

export let logLevel = getNoError<number>(0, () =>
	JSON.parse(sessionStorage['LOG_LEVEL']),
)

export function setLogLevel(it: number) {
	sessionStorage['LOG_LEVEL'] = JSON.stringify(it)
	logLevel = it
}

export function logGroup() {
	logIndent = logIndent + LEVEL
}

export function logGroupEnd() {
	logIndent = logIndent.slice(0, -LEVEL.length)
}

const cmp = getGlobalCmp()
cmp.setLogLevel = setLogLevel
cmp.getLogLevel = () => logLevel
