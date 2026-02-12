import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { html } from '../c-mp/fun/html'
import { mutateState, useState } from '../c-mp/fun/useState'

export const SlotTestComp = defineComponent<{}>('SlotTestComp', (props, $) => {
	const state = useState('state', {
		value: 0,
	})

	return (
		<>
			<div>
				<Slot get={() => state.value + ''} />
				<div>
					<Slot
						isTrustedHtml
						get={() =>
							html`<b>&quot;Simon&quot;</b> &amp;
								<i>&#039;Garfunkel&#039;</i> (${state.value})` + ''
						}
					/>
				</div>
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
