import { Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/useComponent'
import { useState } from '../c-mp/fun/useState'

export const ShowTestComp = defineComponent<{}>('ShowTestComp', (props, $) => {
	const state = useState('state', {
		flag1: false as boolean | {},
	})

	$.append(
		<>
			<h1>Show</h1>
			<Show
				when={() => state.flag1}
				then={(getFlag1) => (
					<div>
						TRUE (<Slot get={() => JSON.stringify(getFlag1())} />)
					</div>
				)}
				else={() => <div>FALSE</div>}
			/>
			<button
				onclick={() => {
					state.flag1 = true
				}}
			>
				true
			</button>
			<button
				onclick={() => {
					state.flag1 = false
				}}
			>
				false
			</button>
			<button
				onclick={() => {
					state.flag1 = { id: 'yay' }
				}}
			>
				{`{id: 'yay'}`}
			</button>
		</>,
	)

	return $
})
