import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/useComponent'
import { useState } from '../c-mp/fun/useState'

export const SlotTestComp = defineComponent<{}>('SlotTestComp', (props, $) => {
	const state = useState('state', {
		value: 0,
	})

	$.append(
		<>
			<h1>Slot</h1>
			<div>
				<Slot get={() => state.value + ''} />
			</div>
			<div>{() => state.value + ''}</div>
			<button onclick={() => state.value++}>Increment</button>
		</>,
	)

	return $
})
