import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import { mutateState, useState } from '../c-mp/fun/useState'

export const ErrorBoundaryInComponentInfiniteEffectTestComp =
	defineComponent<{}>(
		'ErrorBoundaryInComponentInfiniteEffectTestComp',
		(props, $) => {
			$.append(
				<ErrorBoundary
					debugName='InComponentInfiniteEffect'
					try={() => <ErroringComponent />}
					catch={(p) => (
						<div>
							Error caught: <Slot debugName='errorName' get={() => p.error} />
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
		const state = useState('state', { throw: false, count: 0 })

		useEffect('throw changed [t6e0dm]', () => {
			if (state.throw) {
				mutateState($.debugName, `increment count [t6dpye]`, () => {
					state.count++
				})
			}
		})

		$.append(
			<div>
				<button
					onclick={() => {
						mutateState($.debugName, 'toggle throw [t59me8]', () => {
							state.throw = !state.throw
						})
					}}
				>
					Throw
				</button>
			</div>,
		)

		return $
	},
)
