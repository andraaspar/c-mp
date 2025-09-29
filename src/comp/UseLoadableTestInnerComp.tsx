import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/useComponent'
import { IUseLoadableState } from '../c-mp/fun/useLoadable'

export const UseLoadableTestInnerComp = defineComponent<{
	loadable: IUseLoadableState<any>
	disabledByDefault?: boolean
}>('UseLoadableTestInnerComp', (props, $) => {
	$.append(
		<fieldset>
			<legend>{props.debugName}</legend>
			<div>
				Status: <Slot get={() => props.loadable.status} />
			</div>
			<div>
				Data: <Slot get={() => JSON.stringify(props.loadable.data)} />
			</div>
			<div>
				Error: <Slot get={() => props.loadable.error} />
			</div>
			<div>
				Loaded at:{' '}
				<Slot
					get={() =>
						props.loadable.loadedAt == null
							? ''
							: new Date(props.loadable.loadedAt).toLocaleString('hu')
					}
				/>
			</div>
		</fieldset>,
	)

	return $
})
