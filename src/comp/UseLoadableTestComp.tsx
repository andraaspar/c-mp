import { Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { seconds } from '../c-mp/fun/seconds'
import { defineComponent } from '../c-mp/fun/useComponent'
import { reloadLoadables, useLoadable } from '../c-mp/fun/useLoadable'
import { useState } from '../c-mp/fun/useState'

export const UseLoadableTestComp = defineComponent<{}>(
	'UseLoadableTestComp',
	(props, $) => {
		const state = useState('state', { showOne: false, showTwo: false })

		$.append(
			<>
				<h1>useLoadable</h1>
				<Show
					when={() => state.showOne}
					then={() => <UseLoadableTestInnerComp debugName='One' />}
				/>
				<Show
					when={() => state.showTwo}
					then={() => (
						<UseLoadableTestInnerComp debugName='Two' enabledByDefault />
					)}
				/>
				<button
					onclick={() => {
						state.showOne = !state.showOne
					}}
				>
					<Slot get={() => (state.showOne ? 'Hide' : 'Show')} /> One
				</button>
				<button
					onclick={() => {
						state.showTwo = !state.showTwo
					}}
				>
					<Slot get={() => (state.showTwo ? 'Hide' : 'Show')} /> Two
				</button>
				<button
					onclick={() => {
						reloadLoadables()
					}}
				>
					Reload
				</button>
			</>,
		)

		return $
	},
)

const UseLoadableTestInnerComp = defineComponent<{
	enabledByDefault?: boolean
}>('UseLoadableTestInnerComp', (props, $) => {
	const state = useState('state', {
		isEnabled: !!props.enabledByDefault,
	})

	const loadable = useLoadable('test', () => ({
		load: loadString,
		params: undefined,
		isEnabled: state.isEnabled,
		staleAfter: seconds(3),
		deleteAfter: seconds(3),
	}))

	$.append(
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>
				Status: <Slot get={() => loadable.status} />
			</div>
			<div>
				Data: <Slot get={() => JSON.stringify(loadable.data)} />
			</div>
			<div>
				Error: <Slot get={() => loadable.error} />
			</div>
			<div>
				Loaded at:{' '}
				<Slot
					get={() =>
						loadable.loadedAt == null
							? ''
							: new Date(loadable.loadedAt).toLocaleString('hu')
					}
				/>
			</div>
			<button
				onclick={() => {
					state.isEnabled = !state.isEnabled
				}}
			>
				<Slot get={() => (state.isEnabled ? 'Disable' : 'Enable')} />
			</button>
		</fieldset>,
	)

	return $
})

async function loadString() {
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(Date.now().toString(36)), 1000)
	})
}
