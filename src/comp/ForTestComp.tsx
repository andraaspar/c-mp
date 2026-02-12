import { For } from '../c-mp/comp/For'
import { $when, Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { mutateState, useState } from '../c-mp/fun/useState'

export const ForTestComp = defineComponent<{}>('ForTestComp', (props, $) => {
	const state = useState('state', { arr: [] as string[] })

	return (
		<>
			<For
				debugName='arr'
				each={() => state.arr}
				getKey={(it) => it}
				render={({ get, getIndex, getLength }) => (
					<div>
						<label>
							<input type='checkbox' />
							<Slot get={get} />
						</label>{' '}
						<button
							disabled={() => getIndex() === 0}
							onclick={() => {
								mutateState($.debugName, 'move item up [tacirg]', () => {
									const it = state.arr.splice(getIndex(), 1)[0]
									if (it != null) state.arr.splice(getIndex() - 1, 0, it)
								})
							}}
						>
							↑
						</button>{' '}
						<button
							disabled={() => getIndex() === getLength() - 1}
							onclick={() => {
								mutateState($.debugName, 'move item down [tacjlt]', () => {
									const it = state.arr.splice(getIndex(), 1)[0]
									if (it != null) state.arr.splice(getIndex() + 1, 0, it)
								})
							}}
						>
							↓
						</button>{' '}
						<button
							onclick={() => {
								mutateState($.debugName, 'remove item [t59lu9]', () => {
									state.arr.splice(getIndex(), 1)
								})
							}}
						>
							×
						</button>
					</div>
				)}
				empty={() => <div>– No items. –</div>}
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
				it={$when(
					() => state.arr.length % 2 === 0,
					() => (
						<>
							The number of elements is: <b>EVEN</b>
						</>
					),
				)}
			/>
		</>
	)
})
