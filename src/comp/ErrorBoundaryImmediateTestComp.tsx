import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { defineComponent } from '../c-mp/fun/defineComponent'

export const ErrorBoundaryImmediateTestComp = defineComponent<{}>(
	'ErrorBoundaryImmediateTestComp',
	(props, $) => {
		$.append(
			<div>
				<ErrorBoundary
					debugName='Immediate'
					try={() => {
						throw new Error(`Test!`)
					}}
					catch={(p) => <>Immediate error caught: {() => p.error}</>}
				/>
			</div>,
		)

		return $
	},
)
