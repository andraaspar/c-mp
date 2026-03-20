import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import {
	type IUseQueryState,
	maybeReloadQueriesOnVisible,
	reloadQueries,
	resetQueries,
	useQuery,
} from '../c-mp/fun/useQuery'

export const UseQueryDependentTestComp = defineComponent<{}>(
	'UseQueryDependentTestComp',
	(props, $) => {
		const main = useQuery('main', () => ({
			key: 'main',
			load: loadMain,
			params: {},
		}))
		const sub = useQuery('sub', () => ({
			key: 'sub',
			load: loadSub,
			params: { value: main.data! },
			isEnabled: !!main.data,
		}))

		return (
			<>
				<UseQueryDependentInnerComp debugName='main' query={main} />
				<UseQueryDependentInnerComp debugName='sub' query={sub} />
				<button
					onclick={() => {
						maybeReloadQueriesOnVisible('main')
						maybeReloadQueriesOnVisible('sub')
					}}
				>
					Maybe reload
				</button>
				<button
					onclick={() => {
						reloadQueries('main')
						reloadQueries('sub')
					}}
				>
					Reload
				</button>
				<button
					onclick={() => {
						resetQueries('main')
						resetQueries('sub')
					}}
				>
					Reset
				</button>
			</>
		)
	},
)

async function loadMain(o: any) {
	console.log('loadMain', o)
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(Date.now().toString(36)), 1000)
	})
}

async function loadSub(o: { value: string }) {
	console.log('loadSub', o)
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(o.value + '_sub'), 1000)
	})
}

const UseQueryDependentInnerComp = defineComponent<{
	query: IUseQueryState<any>
	disabledByDefault?: boolean
}>('UseQueryTestInnerComp', (props, $) => {
	return (
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>
				Status: <Slot get={() => props.query.status} />
			</div>
			<div>
				Data: <Slot get={() => JSON.stringify(props.query.data)} />
			</div>
			<div>
				Error: <Slot get={() => props.query.error} />
			</div>
			<div>
				Loaded at:{' '}
				<Slot
					get={() =>
						props.query.loadedAt == null
							? ''
							: new Date(props.query.loadedAt).toLocaleString('hu')
					}
				/>
			</div>
		</fieldset>
	)
})
