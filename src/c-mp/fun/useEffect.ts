import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { logGroup, logGroupEnd, logIndent, logLevel } from './log'
import { activeComps } from './useComponent'

export interface IEffectProxyTracker {
	name: string
	rerun?: () => void
	chain: string[]
}

export const activeEffects: IEffectProxyTracker[] = []
let scheduledEffects = 0
let noScheduledEffectsCallbacks: (() => void)[] = []

export function useEffect(
	name: string,
	fn: () => (() => void) | void,
	parentName = activeComps.at(-1)?.debugName ?? '-',
) {
	name = `${parentName}→${name}`
	let proxyTracker: IEffectProxyTracker = { name, rerun: run, chain: [] }
	let lastCleanup: (() => void) | void
	let isScheduled = false
	let isKilled = false

	function kill() {
		if (isKilled) return
		isKilled = true
		runLastCleanup()
		if (logLevel >= 3)
			console.log(`${logIndent}💀 Killed effect: %c${name}`, HIGHLIGHT)
	}

	function runLastCleanup() {
		if (logLevel >= 2) {
			console.log(`${logIndent}🧹 Cleaning up effect: %c${name}`, HIGHLIGHT)
			logGroup()
		}

		// This makes it impossible to run the effect from the existing proxy
		// trackers. It effectively unregisters those trackers. The next run will
		// register new trackers.
		proxyTracker.rerun = undefined
		try {
			lastCleanup?.()
		} catch (e) {
			if (parentComponent) parentComponent.handleError(e)
			else console.error(logIndent, e)
		} finally {
			lastCleanup = undefined
		}
		if (logLevel >= 2) logGroupEnd()
	}

	function run() {
		if (isKilled || isScheduled) return

		const chain = getChain(name)

		// The actual work is done at the end of the current animation frame,
		// similar to a Promise. This allows multiple changes to accumulate and
		// trigger a run only once.
		isScheduled = true
		scheduledEffects++
		queueMicrotask(() => {
			if (!isKilled) {
				isScheduled = false
				if (logLevel >= 2) {
					console.log(`${logIndent}– Effect microtask: %c${name}`, HIGHLIGHT)
					logGroup()
				}
				runLastCleanup()
				try {
					proxyTracker = { name, rerun: run, chain }
					if (logLevel >= 2) {
						console.log(`${logIndent}▶️ Effect run: %c${name}`, HIGHLIGHT)
						logGroup()
					}
					// console.debug(`Effect run:`, name)
					activeEffects.push(proxyTracker)
					// Async functions may not have run just yet... they may add
					// additional effect runs, not tracked by scheduledEffects. Could be
					// solved by awaiting here.
					lastCleanup = fn()
				} catch (e) {
					if (parentComponent) parentComponent.handleError(e)
					else console.error(logIndent, e)
				} finally {
					activeEffects.pop()
					// console.debug(`Effect run end:`, name)
					if (logLevel >= 2) logGroupEnd()
					if (logLevel >= 2) logGroupEnd()
				}
			}
			if (--scheduledEffects === 0) {
				if (logLevel >= 2) console.log(`${logIndent}🏁 All effects are done.`)
				for (let i = noScheduledEffectsCallbacks.length - 1; i >= 0; i--) {
					try {
						noScheduledEffectsCallbacks[i]?.()
					} catch (e) {
						console.error(logIndent, e)
					} finally {
						noScheduledEffectsCallbacks.splice(i, 1)
					}
				}
			}
		})
	}

	const parentComponent = activeComps.at(-1)
	if (!parentComponent) {
		throw new Error(`[svhdq6] No active context for effect: ${name}`)
	}
	parentComponent.kills.push(kill)

	try {
		run()
	} catch (e) {
		parentComponent.handleError(e)
		throw e
	}

	return kill
}

function getChain(name: string) {
	const caller = activeEffects.at(-1)
	const chain = [...(caller?.chain ?? []), name]
	if (chain.length > 500) {
		console.log(`${logIndent}Infinite effect recursion chain:`, chain)
		throw new Error(`[svhnon] Infinite effect recursion.`)
	}
	return chain
}

export function untrack<T>(
	name: string,
	fn: () => T,
	parentName = activeEffects.at(-1)?.name ?? '-',
) {
	name = `${parentName}→${name}`
	try {
		if (logLevel >= 2) {
			console.log(`${logIndent}🚧 Untrack start: %c${name}`, HIGHLIGHT)
			logGroup()
		}
		activeEffects.push({ name: `${name} (untrack)`, chain: getChain(name) })
		return fn()
	} finally {
		activeEffects.pop()
		if (logLevel >= 2) logGroupEnd()
	}
}

export function allEffectsDone() {
	return new Promise<void>((resolve) => {
		if (scheduledEffects === 0) resolve()
		else noScheduledEffectsCallbacks.push(resolve)
	})
}
