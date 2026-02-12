import { defineComponent } from '../c-mp/fun/defineComponent'
import { h } from '../c-mp/fun/h'
import { $For, $Fragment, $Show, $Slot } from '../c-mp/fun/hyperscriptHelpers'
import { mutateState, useState } from '../c-mp/fun/useState'

export const HyperscriptTestComp = defineComponent<{}>(
	'HyperscriptTestComp',
	(props, $) => {
		const state = useState('state', { arr: [] as string[] })

		return $Fragment(
			$For({
				debugName: 'arr',
				each: () => state.arr,
				getKey: (it) => it,
				render: ({ getItem, getIndex, getLength }) =>
					h('div', {
						children: [
							h('label', {
								children: [
									h('input', { type: 'checkbox' }),
									$Slot({ get: getItem }),
								],
							}),
							' ',
							h('button', {
								disabled: () => getIndex() === 0,
								onclick: () => {
									mutateState($.debugName, 'move item up [tacju1]', () => {
										const it = state.arr.splice(getIndex(), 1)[0]
										if (it != null) state.arr.splice(getIndex() - 1, 0, it)
									})
								},
								children: '↑',
							}),
							' ',
							h('button', {
								disabled: () => getIndex() === getLength() - 1,
								onclick: () => {
									mutateState($.debugName, 'move item down [tacjud]', () => {
										const it = state.arr.splice(getIndex(), 1)[0]
										if (it != null) state.arr.splice(getIndex() + 1, 0, it)
									})
								},
								children: '↓',
							}),
							' ',
							h('button', {
								onclick: () => {
									mutateState($.debugName, 'remove item [t59lxo]', () => {
										state.arr.splice(getIndex(), 1)
									})
								},
								children: '×',
							}),
						],
					}),
				empty: () => h('div', { children: '– No items. –' }),
			}),
			h('button', {
				onclick: () => {
					mutateState($.debugName, 'add item [t59ly5]', () => {
						state.arr.push(Date.now().toString(36))
					})
				},
				children: [
					h('b', { children: 'Add' }),
					' ',
					h('i', { children: 'item' }),
				],
			}),
			' ',
			$Show({
				it: {
					when: () => state.arr.length % 2 === 0,
					then: () =>
						$Fragment(
							'The number of elements is: ',
							h('b', { children: 'EVEN' }),
						),
				},
			}),
		)
	},
)
