import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'

export const ErrorBoundaryInComponentInitTestComp = defineComponent<{}>(
	'ErrorBoundaryInComponentInitTestComp',
	(props, $) => {
		$.append(
			<ErrorBoundary
				debugName='InComponentInit'
				try={() => <ErroringComponent />}
				catch={(p) => (
					<div>
						Error caught: <Slot get={() => p.error} />
					</div>
				)}
			/>,
		)

		return $
	},
)

export const ErroringComponent = defineComponent<{}>(
	'ErroringComponent',
	(props, $) => {
		throw new Error(`Test!`)
	},
)
