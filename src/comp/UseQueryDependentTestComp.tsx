import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import {
	type IUseQueryState,
	reloadQueries,
	useQuery,
} from '../c-mp/fun/useQuery'

export const UseQueryDependentTestComp = defineComponent<{}>(
	'UseQueryDependentTestComp',
	(props, $) => {
		const main = useQuery('main', () => ({
			key: 't57hck',
			load: loadString,
			params: {},
		}))
		const sub = useQuery('sub', () => ({
			key: 't57hcm',
			load: loadString2,
			params: { value: main.data! },
			isEnabled: !!main.data,
		}))

		return (
			<>
				<UseQueryDependentInnerComp debugName='main' query={main} />
				<UseQueryDependentInnerComp debugName='sub' query={sub} />
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

async function loadString(o: any) {
	return new Promise<string>((resolve) => {
		setTimeout(() => resolve(Date.now().toString(36)), 1000)
	})
}

async function loadString2(o: { value: string }) {
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
