import { arrayWrap } from '../fun/arrayWrap'
import { Comp, defineComponent } from '../fun/defineComponent'
import { h } from '../fun/h'
import { stripStack } from '../fun/stripStack'
import { unchain } from '../fun/useEffect'
import { type IProps } from '../model/IProps'
import { TChildren } from '../model/TChildren'

export interface IErrorBoundaryCatchParams {
	debugName: string
	error: string
	stack: string
	reset: () => void
}

export const ErrorBoundary = defineComponent<{
	try: () => TChildren
	catch: (p: IErrorBoundaryCatchParams) => TChildren
}>('ErrorBoundary', (props, $) => {
	// Add error handler to c-mp.
	$.onError = (e) => {
		// Remove c-mp parts from stack trace.
		stripStack(e)
		console.error(`${$.debugName}:`, e)
		unchain('unChainErrorRender', () => {
			render(e + '', e instanceof Error ? e.stack : e + '')
		})
	}

	function reset() {
		// Render no error.
		render()
	}

	let innerComponent: Comp<any> | undefined

	function render(error?: string, stack?: string) {
		innerComponent?.remove()

		// Create ad-hoc component for try & catch callbacks.
		if (error) {
			innerComponent = h(ErrorBoundaryCatch, {
				debugName: $.debugName,
				fn: () =>
					props.catch({
						debugName: $.debugName,
						error,
						stack: stack ?? error,
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

export interface IErrorBoundaryTryProps extends IProps {
	fn: () => TChildren
}

const ErrorBoundaryTry = defineComponent<IErrorBoundaryTryProps>(
	'ErrorBoundaryTry',
	(props, $) => {
		$.append(...arrayWrap(props.fn()))
		return $
	},
)

export interface IErrorBoundaryCatchProps extends IProps {
	fn: () => TChildren
}

const ErrorBoundaryCatch = defineComponent<IErrorBoundaryCatchProps>(
	'ErrorBoundaryCatch',
	(props, $) => {
		$.append(...arrayWrap(props.fn()))
		return $
	},
)
