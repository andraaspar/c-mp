import { log3 } from '../fun/log'
import { Comp, defineComponent, useComponent } from '../fun/useComponent'
import { useEffect } from '../fun/useEffect'
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

		// Last kill function is stored here, because it can survive multiple effect
		// reruns.
		let lastComp: Comp<any> | undefined

		useEffect($.debugName, () => {
			const lastFlag = flag
			flag = !!props.when?.()
			log3(`💫 ${$.debugName} value:`, lastFlag, `→`, flag)
			if (!flag === !lastFlag && lastFlag !== NEVER) return

			lastComp?.remove()
			lastComp = undefined

			// Create a component, so inner effects will be cleaned up properly, when
			// the shown branch changes.
			if (!!flag) {
				if (props.then) {
					lastComp = useComponent<IShowInnerProps<T>>(ShowThen, {
						fn: () => props.then!(props.when as TThenValueGetter<T>),
					})
				}
			} else {
				if (props.else) {
					lastComp = useComponent<IShowInnerProps<T>>(ShowElse, {
						fn: props.else,
					})
				}
			}
			if (lastComp) $.append(lastComp)
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
		if (Array.isArray(el)) $.append(...el)
		else if (el) $.append(el)
		return $
	},
)
const ShowElse = defineComponent(
	'ShowElse',
	<T>(props: IShowInnerProps<T>, $: Comp<IShowInnerProps<T>>) => {
		const el = props.fn()
		if (Array.isArray(el)) $.append(...el)
		else if (el) $.append(el)
		return $
	},
)
