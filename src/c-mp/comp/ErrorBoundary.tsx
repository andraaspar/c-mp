import { childToBasicItem } from '../fun/childToBasicItem'
import { stripStack } from '../fun/stripStack'
import { Comp, defineComponent, useComponent } from '../fun/useComponent'
import { IProps } from '../model/IProps'
import { TChildrenIn } from '../model/TChildrenIn'

export interface IErrorBoundaryCatchProps extends IProps {
	error: string
	reset: () => void
}

export interface IErrorBoundaryProps extends IProps {
	try: () => TChildrenIn
	catch: (p: IErrorBoundaryCatchProps) => TChildrenIn
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
			if (error) {
				innerComponent = useComponent(ErrorBoundaryCatch, {
					debugName: props.debugName,
					fn: () =>
						props.catch({
							debugName: $.debugName,
							error,
							reset,
						}),
				})
			} else {
				innerComponent = useComponent(ErrorBoundaryTry, {
					debugName: props.debugName,
					fn: props.try,
				})
			}

			$.append(innerComponent)
		}

		// Render try content.
		render()

		return $
	},
)

const ErrorBoundaryTry = defineComponent<{
	fn: () => TChildrenIn
}>('ErrorBoundaryTry', (props, $) => {
	const el = props.fn()
	if (Array.isArray(el)) {
		$.append(...el.map(childToBasicItem))
	} else {
		$.append(childToBasicItem(el))
	}
	return $
})
const ErrorBoundaryCatch = defineComponent<{
	fn: () => TChildrenIn
}>('ErrorBoundaryCatch', (props, $) => {
	const el = props.fn()
	if (Array.isArray(el)) {
		$.append(...el.map(childToBasicItem))
	} else {
		$.append(childToBasicItem(el))
	}
	return $
})
