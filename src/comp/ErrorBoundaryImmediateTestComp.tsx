import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'

export const ErrorBoundaryImmediateTestComp = defineComponent<{}>(
	'ErrorBoundaryImmediateTestComp',
	(props, $) => {
		return (
			<div>
				<ErrorBoundary
					debugName='Immediate'
					try={() => {
						throw new Error(`Test!`)
					}}
					catch={(p) => (
						<>
							Immediate error caught: <Slot get={() => p.error} />
						</>
					)}
				/>
			</div>
		)
	},
)
