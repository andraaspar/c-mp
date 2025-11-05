import { defineComponent } from '../c-mp/fun/defineComponent'
import {
	IUseLoadableState,
	reloadLoadables,
	useLoadable,
} from '../c-mp/fun/useLoadable'

export const UseLoadableDependentTestComp = defineComponent<{}>(
	'UseLoadableDependentTestComp',
	(props, $) => {
		const main = useLoadable('main', () => ({
			key: 't57hck',
			load: loadString,
			params: {},
		}))
		const sub = useLoadable('sub', () => ({
			key: 't57hcm',
			load: loadString2,
			params: { value: main.data! },
			isEnabled: !!main.data,
		}))

		$.append(
			<>
				<UseLoadableDependentInnerComp debugName='main' loadable={main} />
				<UseLoadableDependentInnerComp debugName='sub' loadable={sub} />
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

const UseLoadableDependentInnerComp = defineComponent<{
	loadable: IUseLoadableState<any>
	disabledByDefault?: boolean
}>('UseLoadableTestInnerComp', (props, $) => {
	$.append(
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>Status: {() => props.loadable.status}</div>
			<div>Data: {() => JSON.stringify(props.loadable.data)}</div>
			<div>Error: {() => props.loadable.error}</div>
			<div>
				Loaded at:{' '}
				{() =>
					props.loadable.loadedAt == null
						? ''
						: new Date(props.loadable.loadedAt).toLocaleString('hu')
				}
			</div>
		</fieldset>,
	)

	return $
})
