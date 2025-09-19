import { log3 } from '../fun/log'
import { Comp, defineComponent, useComponent } from '../fun/useComponent'
import { untrack, useEffect } from '../fun/useEffect'
import { useState } from '../fun/useState'
import { IProps } from '../model/IProps'

export type TKey = string | number | bigint | symbol | boolean

export interface IForState<T> {
	item: T
	index: number
}
export interface IForElemProps<T> extends IProps {
	state: IForState<T>
}

export interface IForProps<T> extends IProps {
	each: () => T[] | undefined
	getKey?: (item: T, index: number) => TKey
	render: (state: IForState<T>) => JSX.Element | string
	empty?: () => JSX.Element | string
}

export interface IForItemData<T> {
	elem: Comp<IForItemProps<T>>
	state: IForState<T>
}

export const For = defineComponent(
	'For',
	<T>(props: IForProps<T>, $: Comp<IForProps<T>>) => {
		let emptyElem: Comp<any> | undefined

		// Store item data here to let items survive multiple effect runs.
		const key__itemData = new Map<TKey, IForItemData<T>>()

		useEffect($.debugName, () => {
			const items = props.each() ?? []

			// This will hold keys for items that are no longer in the list.
			const redundantKeys = new Set(key__itemData.keys())

			// Gather keys for each item. Remove found keys from redundant keys.
			const keys: TKey[] = []
			for (let index = 0, n = items.length; index < n; index++) {
				const item = items[index]!
				const key = props.getKey?.(item, index) ?? index
				keys.push(key)
				redundantKeys.delete(key)
			}
			log3(`🧹 Redundant keys ${$.debugName}:`, redundantKeys)

			// Remove items with redundant keys. Do this here before sorting items to
			// avoid unnecessary move operations, as those trigger full component
			// reinitialization.
			for (const key of redundantKeys) {
				const data = key__itemData.get(key)
				if (data) {
					data.elem.remove()
				}
				key__itemData.delete(key)
			}

			if (items.length === 0) {
				if (!emptyElem && props.empty) {
					emptyElem = useComponent(ForEmpty, {
						debugName: props.debugName,
						empty: props.empty,
					})
					$.append(emptyElem)
				}
			} else {
				if (emptyElem) {
					emptyElem.remove()
					emptyElem = undefined
				}
			}

			// Store last element for inserting next element.
			let lastElem: Comp<IForItemProps<T>> | undefined
			for (let index = 0, n = items.length; index < n; index++) {
				const item = items[index]!
				const key = keys[index]!
				let itemData = key__itemData.get(key)
				untrack($.debugName, () => {
					if (itemData) {
						// Existing item.
						itemData.state.index = index
						// Update the item in case we had no keys and the list shifted.
						itemData.state.item = item
					} else {
						// Initialize new item.
						const state = useState<IForState<T>>(`${$.debugName}`, {
							index,
							item,
						})

						// Create a context for each item to allow effects to work. This will
						// run outside the For context, so it must be disposed of manually.
						// Hence, we store the kill function.
						const elem = useComponent<IForItemProps<T>>(ForItem, {
							debugName: props.debugName,
							state,
							render: props.render,
						})
						itemData = { elem, state }
						key__itemData.set(key, itemData)
					}

					// Move element to its correct position in the DOM. Moving a component
					// will trigger disconnect & connect, so avoid doing this if possible.
					if (lastElem) {
						if (lastElem.nextElementSibling !== itemData.elem) {
							lastElem.after(itemData.elem)
						}
					} else {
						if (
							itemData.elem.parentElement?.firstElementChild !== itemData.elem
						) {
							$.prepend(itemData.elem)
						}
					}
					lastElem = itemData.elem
				})
			}
		})
		return $
	},
)

export interface IForItemProps<T> extends IProps {
	state: IForState<T>
	render: (state: IForState<T>) => JSX.Element | string
}

const ForItem = defineComponent(
	'ForItem',
	<T>({ state, render }: IForItemProps<T>, $: Comp<IForItemProps<T>>) => {
		$.append(render(state))
		return $
	},
)

const ForEmpty = defineComponent<{ empty: () => JSX.Element | string }>(
	'ForEmpty',
	(props, $) => {
		$.append(props.empty())
		return $
	},
)
