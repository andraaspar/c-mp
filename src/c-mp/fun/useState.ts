import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { activeComps } from './defineComponent'
import { logLevel } from './log'
import { IProxifyCallbacks, proxify } from './proxify'
import { activeEffects, allEffectsDone, IEffectProxyTracker } from './useEffect'

const target__props__effects: WeakMap<
	object,
	Map<string | symbol, Set<IEffectProxyTracker>>
> = new WeakMap()

let allowMutation = 0

function runEffects(
	name: string,
	action: string,
	target: object,
	prop: string | symbol,
	value: unknown,
) {
	if (!allowMutation) {
		console.error(`👾 Unlabeled mutation!`)
	}
	if (logLevel >= 1) {
		console.debug(
			`${
				action === 'SET' ? '✏️' : '🗑️'
			} State ${action}: %c${name}.${prop.toString()}`,
			HIGHLIGHT,
			'=',
			value,
		)
	}
	let props__effects = target__props__effects.get(target)
	if (!props__effects) return
	let effects = props__effects.get(prop)
	if (!effects) return
	const effectsArr = Array.from(effects)
	if (effectsArr.length) {
		for (let i = 0; i < effectsArr.length; i++) {
			const effect = effectsArr[i]!
			if (effect.rerun) {
				effect.rerun()
			} else {
				effects.delete(effect)
			}
		}
	}
}

function trackEffect(name: string, target: object, prop: string | symbol) {
	const activeEffect = activeEffects.at(-1)
	if (!activeEffect) return
	if (logLevel >= 3) {
		console.debug(`🔌 State GET: %c${name}.${prop.toString()}`, HIGHLIGHT)
	}
	let props__effects = target__props__effects.get(target)
	if (!props__effects) {
		props__effects = new Map()
		target__props__effects.set(target, props__effects)
	}
	let effects = props__effects.get(prop)
	if (!effects) {
		effects = new Set()
		props__effects.set(prop, effects)
	}
	effects.add(activeEffect)
}

const CBS: IProxifyCallbacks = {
	has(name, target, prop) {
		trackEffect(name, target, prop)
	},
	get(name, target, prop) {
		trackEffect(name, target, prop)
	},
	set(name, target, prop, value) {
		runEffects(name, `SET`, target, prop, value)
	},
	delete(name, target, prop) {
		runEffects(name, `DELETE`, target, prop, undefined)
	},
	cache: new WeakMap(),
}

/**
 * Creates a state proxy that tracks mutations and invokes effects.
 */
export function useState<T>(
	name: string,
	o: T,
	parentName = activeComps.at(-1)?.debugName ?? '-',
): T {
	return proxify(`${parentName} → ${name}`, o, CBS)
}

/**
 * Labels mutations for debugging.
 */
export async function mutateState(
	parent: string,
	name: string,
	fn: () => void,
) {
	try {
		console.log(logLevel >= 1 ? '🔰 👾' : '👾', parent, name)
		allowMutation++
		fn()
	} finally {
		allowMutation--
	}
	if (logLevel >= 1) {
		await allEffectsDone()
		console.debug(`🛑 👾`, parent, name)
	}
}
