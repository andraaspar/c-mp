import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { log2Group, log2GroupEnd, log3 } from './log'
import { activeComps } from './useComponent'

export interface IEffectProxyTracker {
	name: string
	rerun?: () => void
	chain: number
}

export const activeEffects: IEffectProxyTracker[] = []

export function useEffect(name: string, fn: () => (() => void) | void) {
	let proxyTracker: IEffectProxyTracker = { name, rerun: run, chain: 0 }
	let lastCleanup: (() => void) | void
	let isScheduled = false
	let isKilled = false

	function kill() {
		if (isKilled) return
		isKilled = true
		runLastCleanup()
		log3(`💀 Killed effect: %c${name}`, HIGHLIGHT)
	}

	function runLastCleanup() {
		log2Group(`🧹 Cleaning up effect: %c${name}`, HIGHLIGHT)

		// This makes it impossible to run the effect from the existing proxy
		// trackers. It effectively unregisters those trackers. The next run will
		// register new trackers.
		proxyTracker.rerun = undefined
		try {
			lastCleanup?.()
		} catch (e) {
			if (parentComponent) parentComponent.handleError(e)
			else console.error(e)
		} finally {
			lastCleanup = undefined
		}
		log2GroupEnd()
	}

	function run() {
		if (isKilled || isScheduled) return

		const chain = getChain()

		// The actual work is done at the end of the current animation frame,
		// similar to a Promise. This allows multiple changes to accumulate and
		// trigger a run only once.
		isScheduled = true
		queueMicrotask(() => {
			if (isKilled) return
			isScheduled = false
			log2Group(`– Effect microtask: %c${name}`, HIGHLIGHT)
			runLastCleanup()
			try {
				proxyTracker = { name, rerun: run, chain }
				log2Group(`▶️ Effect run: %c${name}`, HIGHLIGHT)
				// console.debug(`Effect run:`, name)
				activeEffects.push(proxyTracker)
				lastCleanup = fn()
			} catch (e) {
				if (parentComponent) parentComponent.handleError(e)
				else console.error(e)
			} finally {
				activeEffects.pop()
				// console.debug(`Effect run end:`, name)
				log2GroupEnd()
				log2GroupEnd()
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

	return run
}

function getChain() {
	const caller = activeEffects.at(-1)
	const chain = (caller?.chain ?? 0) + 1
	if (chain > 500) {
		throw new Error(`[svhnon] Infinite effect recursion: ${name}`)
	}
	return chain
}

export function untrack<T>(name: string, fn: () => T) {
	try {
		log2Group(`🚧 Untrack start: %c${name}`, HIGHLIGHT)
		activeEffects.push({ name: `${name} (untrack)`, chain: getChain() })
		return fn()
	} finally {
		activeEffects.pop()
		log2GroupEnd()
	}
}

export function unchain<T>(name: string, fn: () => T) {
	try {
		log2Group(`✂️ Unchain start: %c${name}`, HIGHLIGHT)
		activeEffects.push({ name: `${name} (unchain)`, chain: 0 })
		return fn()
	} finally {
		activeEffects.pop()
		log2GroupEnd()
	}
}
