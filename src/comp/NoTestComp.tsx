import { defineComponent } from '../c-mp/fun/defineComponent'

export const NoTestComp = defineComponent<{}>('NoTestComp', (props, $) => {
	$.append(
		<>
			<p>Select a test to begin</p>
		</>,
	)

	return $
})
