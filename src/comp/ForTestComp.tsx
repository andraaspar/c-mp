import { For } from '../c-mp/comp/For'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { useState } from '../c-mp/fun/useState'

export const ForTestComp = defineComponent<{}>('ForTestComp', (props, $) => {
	const state = useState('state', { arr: ['foo', 'bar', 'baz', 'quux'] })

	$.append(
		<>
			<For
				each={() => state.arr}
				render={(it) => (
					<div>
						<span>{() => it.item}</span>{' '}
						<button
							onclick={() => {
								state.arr.splice(it.index, 1)
							}}
						>
							×
						</button>
					</div>
				)}
			/>
			<button
				onclick={() => {
					state.arr.push(Date.now().toString(36))
				}}
			>
				<b>Add</b> <i>item</i>
			</button>
		</>,
	)

	return $
})
