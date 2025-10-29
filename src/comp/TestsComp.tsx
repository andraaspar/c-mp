import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { defineComponent } from '../c-mp/fun/useComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import { useState } from '../c-mp/fun/useState'
import { TSlotValue } from '../c-mp/model/TChildrenIn'
import { ForTestComp } from './ForTestComp'
import { HyperscriptTestComp } from './HyperscriptTestComp'
import { ShowTestComp } from './ShowTestComp'
import { SlotTestComp } from './SlotTestComp'
import { UseLoadableInfiniteComp } from './UseLoadableInfiniteComp'
import { UseLoadableTest2Comp } from './UseLoadableTest2Comp'
import { UseLoadableTestComp } from './UseLoadableTestComp'

export const TestsComp = defineComponent<{}>('TestsComp', (props, $) => {
	$.append(
		<>
			<div>
				<a href='#slot'>Slot</a> | <a href='#for'>For</a> |{' '}
				<a href='#show'>Show</a> | <a href='#hyperscript'>Hyperscript</a> |{' '}
				<a href='#use-loadable'>useLoadable</a> |{' '}
				<a href='#use-loadable-2'>useLoadable 2</a> |{' '}
				<a href='#use-loadable-infinite'>useLoadable infinite</a>
			</div>
			<div>
				<ErrorBoundary
					debugName='t2ua2s'
					catch={(it) => <div>{it.error}</div>}
					try={() => [() => state.test]}
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
				case '#use-loadable':
					state.test = <UseLoadableTestComp />
					break
				case '#use-loadable-2':
					state.test = <UseLoadableTest2Comp />
					break
				case '#use-loadable-infinite':
					state.test = <UseLoadableInfiniteComp />
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
