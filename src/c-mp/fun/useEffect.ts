import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { activeComps } from './defineComponent'
import { logLevel } from './log'

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
		if (logLevel >= 3) console.debug(`💀 Killed effect: %c${name}`, HIGHLIGHT)
	}

	function runLastCleanup() {
		if (logLevel >= 2) {
			console.debug(`🔰 🧹 Cleaning up effect: %c${name}`, HIGHLIGHT)
		}

		// This signals to the proxy tracker that this effect is to be removed
		// rather than re-run.
		proxyTracker.rerun = undefined
		try {
			lastCleanup?.()
		} catch (e) {
			if (parentComponent) parentComponent.handleError(e)
			else console.error(e)
		} finally {
			lastCleanup = undefined
		}
		if (logLevel >= 2) {
			console.debug(`🛑 🧹 Cleaning up effect: %c${name}`, HIGHLIGHT)
		}
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
					console.debug(`🔰 – Effect microtask: %c${name}`, HIGHLIGHT)
				}
				runLastCleanup()
				try {
					proxyTracker = { name, rerun: run, chain }
					if (logLevel >= 2) {
						console.debug(`🔰 ▶️ Effect run: %c${name}`, HIGHLIGHT)
					}
					// console.debug(`Effect run:`, name)
					activeEffects.push(proxyTracker)
					// Async functions may not have run just yet... they may add
					// additional effect runs, not tracked by scheduledEffects. Could be
					// solved by awaiting here.
					lastCleanup = fn()
				} catch (e) {
					if (parentComponent) parentComponent.handleError(e)
					else console.error(e)
				} finally {
					activeEffects.pop()
					// console.debug(`Effect run end:`, name)
					if (logLevel >= 2) {
						console.debug(`🛑 ▶️ Effect run: %c${name}`, HIGHLIGHT)
						console.debug(`🛑 – Effect microtask: %c${name}`, HIGHLIGHT)
					}
				}
			}
			if (--scheduledEffects === 0) {
				if (logLevel >= 2) console.debug(`🏁 All effects are done.`)
				for (let i = noScheduledEffectsCallbacks.length - 1; i >= 0; i--) {
					try {
						noScheduledEffectsCallbacks[i]?.()
					} catch (e) {
						console.error(e)
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
		console.debug(`Infinite effect recursion chain:`, chain)
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
			console.debug(`🔰 🚧 Untrack: %c${name}`, HIGHLIGHT)
		}
		activeEffects.push({ name: `${name} (untrack)`, chain: getChain(name) })
		return fn()
	} finally {
		activeEffects.pop()
		if (logLevel >= 2) {
			console.debug(`🛑 🚧 Untrack: %c${name}`, HIGHLIGHT)
		}
	}
}

/** Allows effects to run while handling an infinite recursion error. */
export function unchain<T>(name: string, fn: () => T) {
	try {
		if (logLevel >= 2) {
			console.debug(`🔰 ✂️ Unchain: %c${name}`, HIGHLIGHT)
		}
		activeEffects.push({ name: `${name} (unchain)`, chain: [] })
		return fn()
	} finally {
		activeEffects.pop()
		if (logLevel >= 2) {
			console.debug(`🛑 ✂️ Unchain: %c${name}`, HIGHLIGHT)
		}
	}
}

export function allEffectsDone() {
	return new Promise<void>((resolve) => {
		if (scheduledEffects === 0) resolve()
		else noScheduledEffectsCallbacks.push(resolve)
	})
}
