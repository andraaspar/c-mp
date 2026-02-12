import { $when, Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { seconds } from '../c-mp/fun/seconds'
import { reloadQueries, useQuery } from '../c-mp/fun/useQuery'
import { mutateState, useState } from '../c-mp/fun/useState'

export const UseQueryTestComp = defineComponent<{}>(
	'UseQueryTestComp',
	(props, $) => {
		const state = useState('state', { showOne: false, showTwo: false })

		return (
			<>
				<Show
					it={$when(
						() => state.showOne,
						() => (
							<UseQueryTestInnerComp debugName='One' />
						),
					)}
				/>
				<Show
					it={$when(
						() => state.showTwo,
						() => (
							<UseQueryTestInnerComp debugName='Two' enabledByDefault />
						),
					)}
				/>
				<button
					onclick={() => {
						mutateState($.debugName, 'toggle one [t59m07]', () => {
							state.showOne = !state.showOne
						})
					}}
				>
					<Slot get={() => (state.showOne ? 'Hide' : 'Show')} /> One
				</button>
				<button
					onclick={() => {
						mutateState($.debugName, 'toggle two [t59m0w]', () => {
							state.showTwo = !state.showTwo
						})
					}}
				>
					<Slot get={() => (state.showTwo ? 'Hide' : 'Show')} /> Two
				</button>
				<button
					onclick={() => {
						reloadQueries()
					}}
				>
					Reload
				</button>
			</>
		)
	},
)

const UseQueryTestInnerComp = defineComponent<{
	enabledByDefault?: boolean
}>('UseQueryTestInnerComp', (props, $) => {
	const state = useState('state', {
		isEnabled: !!props.enabledByDefault,
	})

	const query = useQuery('query [t5iga9]', () => ({
		key: 'simple query [t57hcg]',
		load: loadString,
		params: { foo: true },
		isEnabled: state.isEnabled,
		staleAfter: seconds(3),
		deleteAfter: seconds(3),
	}))

	return (
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>
				Status: <Slot get={() => query.status} />
			</div>
			<div>
				Data: <Slot get={() => JSON.stringify(query.data)} />
			</div>
			<div>
				Error: <Slot get={() => query.error} />
			</div>
			<div>
				Loaded at:{' '}
				<Slot
					get={() =>
						query.loadedAt == null
							? ''
							: new Date(query.loadedAt).toLocaleString('hu')
					}
				/>
			</div>
			<button
				onclick={() => {
					mutateState($.debugName, 'toggle enabled [t5ifxr]', () => {
						state.isEnabled = !state.isEnabled
					})
				}}
			>
				<Slot get={() => (state.isEnabled ? 'Disable' : 'Enable')} />
			</button>
		</fieldset>
	)
})

async function loadString(params: { foo: boolean }) {
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(Date.now().toString(36)), 1000)
	})
}
