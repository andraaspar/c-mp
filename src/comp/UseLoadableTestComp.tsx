import { Show } from '../c-mp/comp/Show'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { seconds } from '../c-mp/fun/seconds'
import { reloadLoadables, useLoadable } from '../c-mp/fun/useLoadable'
import { mutateState, useState } from '../c-mp/fun/useState'

export const UseLoadableTestComp = defineComponent<{}>(
	'UseLoadableTestComp',
	(props, $) => {
		const state = useState('state', { showOne: false, showTwo: false })

		$.append(
			<>
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
						mutateState('toggle one [t59m07]', () => {
							state.showOne = !state.showOne
						})
					}}
				>
					{() => (state.showOne ? 'Hide' : 'Show')} One
				</button>
				<button
					onclick={() => {
						mutateState('toggle two [t59m0w]', () => {
							state.showTwo = !state.showTwo
						})
					}}
				>
					{() => (state.showTwo ? 'Hide' : 'Show')} Two
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

	const loadable = useLoadable('loadable [t5iga9]', () => ({
		key: 'simple loadable [t57hcg]',
		load: loadString,
		params: { foo: true },
		isEnabled: state.isEnabled,
		staleAfter: seconds(3),
		deleteAfter: seconds(3),
	}))

	$.append(
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>Status: {() => loadable.status}</div>
			<div>Data: {() => JSON.stringify(loadable.data)}</div>
			<div>Error: {() => loadable.error}</div>
			<div>
				Loaded at:{' '}
				{() =>
					loadable.loadedAt == null
						? ''
						: new Date(loadable.loadedAt).toLocaleString('hu')
				}
			</div>
			<button
				onclick={() => {
					mutateState('toggle enabled [t5ifxr]', () => {
						state.isEnabled = !state.isEnabled
					})
				}}
			>
				{() => (state.isEnabled ? 'Disable' : 'Enable')}
			</button>
		</fieldset>,
	)

	return $
})

async function loadString(params: { foo: boolean }) {
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(Date.now().toString(36)), 1000)
	})
}
