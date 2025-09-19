import { defineComponent } from '../c-mp/fun/useComponent'

export const SlotTestComp = defineComponent<{}>('SlotTestComp', (props, $) => {
	$.append(
		<>
			<h1>Slot</h1>
		</>,
	)

	return $
})
