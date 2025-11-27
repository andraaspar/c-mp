import { defineComponent } from '../fun/defineComponent'
import { expandSlots } from '../fun/expandSlots'
import { h } from '../fun/h'
import { stripStack } from '../fun/stripStack'
import { unchain } from '../fun/useEffect'
import { TChildrenIn } from '../model/TChildren'

export interface IErrorBoundaryCatchProps {
	debugName: string
	error: string
	reset: () => void
}

export const ErrorBoundary = defineComponent<{
	try: () => TChildrenIn
	catch: (p: IErrorBoundaryCatchProps) => TChildrenIn
}>('ErrorBoundary', (props, $) => {
	// Add error handler to c-mp.
	$.onError = (e) => {
		// Remove c-mp parts from stack trace.
		stripStack(e)
		console.error(`${$.debugName}:`, e)
		unchain('unChainErrorRender', () => {
			render(e + '')
		})
	}

	function reset() {
		// Render no error.
		render()
	}

	let innerComponent: Element | undefined

	function render(error?: string) {
		innerComponent?.remove()

		// Create ad-hoc component for try & catch callbacks.
		if (error) {
			innerComponent = h(ErrorBoundaryCatch, {
				debugName: $.debugName,
				fn: () =>
					props.catch({
						debugName: $.debugName,
						error,
						reset,
					}),
			})
		} else {
			innerComponent = h(ErrorBoundaryTry, {
				debugName: props.debugName,
				fn: props.try,
			})
		}

		$.append(innerComponent)
	}

	// Render try content.
	render()

	return $
})

const ErrorBoundaryTry = defineComponent<{
	fn: () => TChildrenIn
}>('ErrorBoundaryTry', (props, $) => {
	const el = props.fn()
	if (Array.isArray(el)) {
		$.append(...el.map(expandSlots))
	} else {
		$.append(expandSlots(el))
	}
	return $
})
const ErrorBoundaryCatch = defineComponent<{
	fn: () => TChildrenIn
}>('ErrorBoundaryCatch', (props, $) => {
	const el = props.fn()
	if (Array.isArray(el)) {
		$.append(...el.map(expandSlots))
	} else {
		$.append(expandSlots(el))
	}
	return $
})
