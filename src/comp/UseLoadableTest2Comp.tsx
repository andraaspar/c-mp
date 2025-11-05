import { defineComponent } from '../c-mp/fun/defineComponent'
import { reloadLoadables, useLoadable } from '../c-mp/fun/useLoadable'
import { UseLoadableTestInnerComp } from './UseLoadableTestInnerComp'

export const UseLoadableTest2Comp = defineComponent<{}>(
	'UseLoadableTest2Comp',
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
				<h1>useLoadable 2</h1>
				<UseLoadableTestInnerComp debugName='main' loadable={main} />
				<UseLoadableTestInnerComp debugName='sub' loadable={sub} />
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
