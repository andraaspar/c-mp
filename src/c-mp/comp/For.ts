import { Comp, defineComponent } from '../fun/defineComponent'
import { h } from '../fun/h'
import { logLevel } from '../fun/log'
import { untrack, useEffect } from '../fun/useEffect'
import { mutateState, useState } from '../fun/useState'
import { EMPTY_FRAGMENT } from '../model/EMPTY_FRAGMENT'
import { type IProps } from '../model/IProps'

export type TKey = string | number | bigint | symbol | boolean

export interface IForState<T> {
	item: T
	index: number
}
export interface IForElemProps<T> {
	state: IForState<T>
}

export interface IForProps<T> extends IProps {
	debugName: string
	each: () => T[] | undefined
	getKey?: (item: T, index: number) => TKey
	render: (state: IForState<T>) => JSX.Element
	empty?: () => JSX.Element
}

export interface IForItemData<T> {
	elem: Element
	state: IForState<T>
}

export const For = defineComponent(
	'For',
	<T>(props: IForProps<T>, $: Comp<IForProps<T>>) => {
		let emptyElem: Element | undefined

		// Store item data here to let items survive multiple effect runs.
		const key__itemData = new Map<TKey, IForItemData<T>>()

		useEffect('update items [t6e00f]', () => {
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
			if (redundantKeys.size) {
				if (logLevel >= 3) {
					console.debug(`🧹 Redundant keys ${$.debugName}:`, redundantKeys)
				}

				// Remove items with redundant keys. Do this here before sorting items to
				// avoid unnecessary move operations, as those trigger full component
				// reinitialization.
				untrack('redundant [t6e01i]', () => {
					for (const key of redundantKeys) {
						const data = key__itemData.get(key)
						if (data) {
							data.elem.remove()
						}
						key__itemData.delete(key)
					}
				})
			}

			if (items.length === 0) {
				if (!emptyElem && props.empty) {
					emptyElem = h(ForEmpty, {
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

			untrack('update [t6e01d]', () => {
				// Store last element for inserting next element.
				let lastElem: Element | undefined
				mutateState($.debugName, `update items [t5im53]`, () => {
					for (let index = 0, n = items.length; index < n; index++) {
						const item = items[index]!
						const key = keys[index]!
						let itemData = key__itemData.get(key)
						if (itemData) {
							// Existing item.
							itemData.state.index = index
							// Update the item in case we had no keys and the list shifted.
							itemData.state.item = item
						} else {
							// Initialize new item.
							const state = useState<IForState<T>>(
								`${$.debugName} → itemState`,
								{
									index,
									item,
								},
							)

							// Create a context for each item to allow effects to work. This will
							// run outside the For context, so it must be disposed of manually.
							// Hence, we store the kill function.
							const elem = h(ForItem<T>, {
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
					}
				})
			})
		})

		return EMPTY_FRAGMENT
	},
)

export interface IForItemProps<T> extends IProps {
	state: IForState<T>
	render: (state: IForState<T>) => JSX.Element
}

const ForItem = defineComponent(
	'ForItem',
	<T>({ state, render }: IForItemProps<T>, $: Comp<IForItemProps<T>>) => {
		return render(state)
	},
)

export interface IForEmptyProps<T> extends IProps {
	empty: () => JSX.Element
}

const ForEmpty = defineComponent(
	'ForEmpty',
	<T>(props: IForEmptyProps<T>, $: Comp<IForEmptyProps<T>>) => {
		return props.empty()
	},
)
