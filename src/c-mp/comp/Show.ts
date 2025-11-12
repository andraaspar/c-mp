import { Comp, defineComponent } from '../fun/defineComponent'
import { expandSlots } from '../fun/expandSlots'
import { h } from '../fun/h'
import { logLevel } from '../fun/log'
import { untrack, useEffect } from '../fun/useEffect'
import { IProps } from '../model/IProps'
import { TChildrenIn } from '../model/TChildrenIn'

export type TThenValue<T> = Exclude<T, false | null | undefined | 0 | '' | 0n>
export type TThenValueGetter<T> = () => TThenValue<T>

// This is a placeholder value, so the comparison with the last value fails the
// first time.
const NEVER = Symbol('NEVER')

export interface IShowProps<T> extends IProps {
	when: (() => T) | undefined
	then?: (get: TThenValueGetter<T>) => TChildrenIn
	else?: () => TChildrenIn
}

export const Show = defineComponent(
	'Show',
	<T>(props: IShowProps<T>, $: Comp<IShowProps<T>>) => {
		// Remember the last flag to be able to decide if we need to recreate the
		// content.
		let flag: boolean | typeof NEVER = NEVER

		// Last inner component is stored here, because it can survive multiple
		// effect reruns.
		let lastComp: Comp<any> | undefined

		useEffect('showWhenEffect', () => {
			const lastFlag = flag
			flag = !!props.when?.()
			if (logLevel >= 3) {
				console.debug(`💫 ${$.debugName} value:`, lastFlag, `→`, flag)
			}
			if (!flag === !lastFlag && lastFlag !== NEVER) return

			untrack('untrackShowWhenEffect', () => {
				lastComp?.remove()
				lastComp = undefined

				// Create a component, so inner effects will be cleaned up properly, when
				// the shown branch changes.
				if (!!flag) {
					if (props.then) {
						lastComp = h(ShowThen<T>, {
							fn: () => props.then!(props.when as TThenValueGetter<T>),
						})
					}
				} else {
					if (props.else) {
						lastComp = h(ShowElse, {
							fn: props.else,
						})
					}
				}
				if (lastComp) $.append(lastComp)
			})
		})

		return $
	},
)

interface IShowInnerProps<T> extends IProps {
	fn: () => TChildrenIn | undefined
}
const ShowThen = defineComponent(
	'ShowThen',
	<T>(props: IShowInnerProps<T>, $: Comp<IShowInnerProps<T>>) => {
		const el = props.fn()
		if (Array.isArray(el)) $.append(...el.map(expandSlots))
		else if (el) $.append(expandSlots(el))
		return $
	},
)
const ShowElse = defineComponent(
	'ShowElse',
	<T>(props: IShowInnerProps<T>, $: Comp<IShowInnerProps<T>>) => {
		const el = props.fn()
		if (Array.isArray(el)) $.append(...el.map(expandSlots))
		else if (el) $.append(expandSlots(el))
		return $
	},
)
