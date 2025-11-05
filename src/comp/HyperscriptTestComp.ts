import { For } from '../c-mp/comp/For'
import { Show } from '../c-mp/comp/Show'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { h } from '../c-mp/fun/h'
import { useState } from '../c-mp/fun/useState'

export const HyperscriptTestComp = defineComponent<{}>(
	'HyperscriptTestComp',
	(props, $) => {
		const state = useState('state', { arr: ['foo', 'bar', 'baz', 'quux'] })

		$.append(
			h('h1', { children: 'Hyperscript' }),
			h(For<string>, {
				each: () => state.arr,
				render: (it) =>
					h('div', {
						children: [
							h('span', { children: () => it.item }),
							' ',
							h('button', {
								onclick: () => {
									state.arr.splice(it.index, 1)
								},
								children: '×',
							}),
						],
					}),
			}),
			h('button', {
				onclick: () => {
					state.arr.push(Date.now().toString(36))
				},
				children: [
					h('b', { children: 'Add' }),
					' ',
					h('i', { children: 'item' }),
				],
			}),
			' ',
			h(Show<boolean>, {
				when: () => state.arr.length % 2 === 0,
				then: () => [
					'The number of elements is: ',
					h('b', { children: 'EVEN' }),
				],
			}),
		)

		return $
	},
)
