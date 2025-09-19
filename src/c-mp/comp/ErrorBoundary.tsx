import { stripStack } from '../fun/stripStack'
import { Comp, defineComponent, useComponent } from '../fun/useComponent'
import { IProps } from '../model/IProps'

export interface IErrorBoundaryCatchProps extends IProps {
	error: string
	reset: () => void
}

export interface IErrorBoundaryProps extends IProps {
	try: () => JSX.Element
	catch: (p: IErrorBoundaryCatchProps) => JSX.Element
}

export const ErrorBoundary = defineComponent<IErrorBoundaryProps>(
	'ErrorBoundary',
	(props, $) => {
		// Add error handler to c-mp.
		$.onError = (e) => {
			// Remove c-mp parts from stack trace.
			stripStack(e)
			console.error(`${$.debugName}:`, e)
			render(e + '')
		}

		function reset() {
			// Render no error.
			render()
		}

		let innerComponent: Comp<any> | undefined

		function render(error?: string) {
			innerComponent?.remove()

			// Create ad-hoc component for try & catch callbacks.
			innerComponent = useComponent(ErrorBoundaryInner, {
				debugName: props.debugName,
				fn: error
					? () =>
							props.catch({
								debugName: $.debugName,
								error,
								reset,
							})
					: props.try,
			})

			$.append(innerComponent)
		}

		// Render try content.
		render()

		return $
	},
)

const ErrorBoundaryInner = defineComponent<{ fn: () => JSX.Element }>(
	'ErrorBoundaryInner',
	(props, $) => {
		$.append(props.fn())
		return $
	},
)
