import { defineComponent } from '../c-mp/fun/defineComponent'
import { IUseLoadableState } from '../c-mp/fun/useLoadable'

export const UseLoadableTestInnerComp = defineComponent<{
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
