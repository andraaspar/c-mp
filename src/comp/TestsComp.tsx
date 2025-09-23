import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { Slot, TSlotValue } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/useComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import { useState } from '../c-mp/fun/useState'
import { ForTestComp } from './ForTestComp'
import { HyperscriptTestComp } from './HyperscriptTestComp'
import { ShowTestComp } from './ShowTestComp'
import { SlotTestComp } from './SlotTestComp'

export const TestsComp = defineComponent<{}>('TestsComp', (props, $) => {
	$.append(
		<>
			<div>
				<a href='#slot'>Slot</a> | <a href='#for'>For</a> |{' '}
				<a href='#show'>Show</a> | <a href='#hyperscript'>Hyperscript</a>
			</div>
			<div>
				<ErrorBoundary
					debugName='t2ua2s'
					catch={(it) => <div>{it.error}</div>}
					try={() => <Slot get={() => state.test} />}
				/>
			</div>
		</>,
	)

	const state = useState('state', {
		test: undefined as TSlotValue,
	})

	useEffect('state from hash [t2u5ey]', () => {
		function onHashChange() {
			switch (location.hash) {
				case '#slot':
					state.test = <SlotTestComp />
					break
				case '#for':
					state.test = <ForTestComp />
					break
				case '#show':
					state.test = <ShowTestComp />
					break
				case '#hyperscript':
					state.test = <HyperscriptTestComp />
					break
				default:
					state.test = undefined
			}
		}
		addEventListener('hashchange', onHashChange)
		onHashChange()

		return () => {
			removeEventListener('hashchange', onHashChange)
		}
	})

	return $
})
