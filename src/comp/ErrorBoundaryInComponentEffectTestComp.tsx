import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import { useState } from '../c-mp/fun/useState'

export const ErrorBoundaryInComponentEffectTestComp = defineComponent<{}>(
	'ErrorBoundaryInComponentEffectTestComp',
	(props, $) => {
		$.append(
			<ErrorBoundary
				debugName='InComponentEffect'
				try={() => <ErroringComponent />}
				catch={(p) => (
					<div>
						Error caught: {() => p.error}
						<br />
						<button onclick={p.reset}>Reset</button>
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
		const state = useState('state', { throw: false })

		useEffect('throwEffect', () => {
			if (state.throw) {
				throw new Error(`Test!`)
			}
		})

		$.append(
			<div>
				<button
					onclick={() => {
						state.throw = !state.throw
					}}
				>
					Throw
				</button>
			</div>,
		)

		return $
	},
)
