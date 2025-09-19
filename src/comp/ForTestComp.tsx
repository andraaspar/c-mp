import { For } from '../c-mp/comp/For'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/useComponent'
import { useState } from '../c-mp/fun/useState'

export const ForTestComp = defineComponent<{}>('ForTestComp', (props, $) => {
	const state = useState('state', { arr: ['foo', 'bar', 'baz'] })

	$.append(
		<>
			<For
				each={() => state.arr}
				render={(it) => (
					<div>
						<Slot get={() => it.item} />
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
				Add item
			</button>
		</>,
	)

	return $
})
