import { For } from '../c-mp/comp/For'
import { Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { mutateState, useState } from '../c-mp/fun/useState'

export const ForTestComp = defineComponent<{}>('ForTestComp', (props, $) => {
	const state = useState('state', { arr: ['foo', 'bar', 'baz', 'quux'] })

	$.append(
		<>
			<For
				debugName='arr'
				each={() => state.arr}
				render={(it) => (
					<div>
						<span>
							<Slot get={() => it.item} />
						</span>{' '}
						<button
							onclick={() => {
								mutateState($.debugName, 'remove item [t59lu9]', () => {
									state.arr.splice(it.index, 1)
								})
							}}
						>
							×
						</button>
					</div>
				)}
			/>
			<button
				onclick={() => {
					mutateState($.debugName, 'add item [t59lq1]', () => {
						state.arr.push(Date.now().toString(36))
					})
				}}
			>
				<b>Add</b> <i>item</i>
			</button>{' '}
			<Show
				it={{
					when: () => state.arr.length % 2 === 0,
					then: () => (
						<>
							The number of elements is: <b>EVEN</b>
						</>
					),
				}}
			/>
		</>,
	)

	return $
})
