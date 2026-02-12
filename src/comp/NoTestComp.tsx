import { defineComponent } from '../c-mp/fun/defineComponent'

export const NoTestComp = defineComponent<{}>('NoTestComp', (props, $) => {
	return <p>Select a test to begin</p>
})
