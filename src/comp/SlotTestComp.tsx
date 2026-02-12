import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { mutateState, useState } from '../c-mp/fun/useState'

export const SlotTestComp = defineComponent<{}>('SlotTestComp', (props, $) => {
	const state = useState('state', {
		value: 0,
	})

	return (
		<>
			<div>
				<Slot get={() => state.value + ''} />
			</div>
			<button
				onclick={() => {
					mutateState($.debugName, 'increment value [t59lma]', () => {
						state.value++
					})
				}}
			>
				Increment
			</button>
		</>
	)
})
