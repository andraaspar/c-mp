import { Comp, defineComponent } from '../fun/defineComponent'
import { h } from '../fun/h'
import { logLevel } from '../fun/log'
import { untrack, useEffect } from '../fun/useEffect'
import { EMPTY_FRAGMENT } from '../model/EMPTY_FRAGMENT'
import { type IProps } from '../model/IProps'

export type TThenValue<T> = Exclude<T, false | null | undefined | 0 | '' | 0n>
export type TThenValueGetter<T> = () => TThenValue<T>

export interface IShowCondition<T> {
	when: () => T
	then: (get: TThenValueGetter<T>) => JSX.Element
}

export interface IShowProps extends IProps {
	it: IShowCondition<any>[] | IShowCondition<any>
	else?: () => JSX.Element
}

export const Show = defineComponent(
	'Show',
	<T>(props: IShowProps, $: Comp<IShowProps>) => {
		// Remember the last index to be able to decide if we need to recreate the
		// content.
		let conditionIndex = NaN

		// Last inner component is stored here, because it can survive multiple
		// effect reruns.
		let lastComp: Comp<any> | undefined

		useEffect('condition changed [t6e02g]', () => {
			const lastConditionIndex = conditionIndex
			const conditions = Array.isArray(props.it) ? props.it : [props.it]
			conditionIndex = conditions.findIndex((it) => it.when())
			if (logLevel >= 2) {
				console.debug(
					`💫 ${$.debugName} condition:`,
					lastConditionIndex,
					`✏️`,
					conditionIndex,
				)
			}
			if (conditionIndex === lastConditionIndex) return

			untrack('update comp [t6e02l]', () => {
				lastComp?.remove()
				lastComp = undefined

				// Create a component, so inner effects will be cleaned up properly, when
				// the shown branch changes.
				const condition = conditions[conditionIndex]
				if (condition) {
					lastComp = h(ShowThen<T>, {
						fn: () => condition.then(condition.when),
					})
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

		return EMPTY_FRAGMENT
	},
)

interface IShowInnerProps extends IProps {
	fn: () => JSX.Element
}
const ShowThen = defineComponent(
	'ShowThen',
	<T>(props: IShowInnerProps, $: Comp<IShowInnerProps>) => {
		return props.fn()
	},
)
const ShowElse = defineComponent(
	'ShowElse',
	<T>(props: IShowInnerProps, $: Comp<IShowInnerProps>) => {
		return props.fn()
	},
)
