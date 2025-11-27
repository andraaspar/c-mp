import { ErrorBoundary } from '../c-mp/comp/ErrorBoundary'
import { For } from '../c-mp/comp/For'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { h } from '../c-mp/fun/h'
import { useEffect } from '../c-mp/fun/useEffect'
import { mutateState, useState } from '../c-mp/fun/useState'
import { TSlotValue } from '../c-mp/model/TChildren'
import { hash__page, page__hash, page__title, pages } from '../model/pages'
import { NoTestComp } from './NoTestComp'

export const TestsComp = defineComponent<{}>('TestsComp', (props, $) => {
	$.append(
		<>
			<LinksComp />
			<hr />
			<h1>{() => state.title}</h1>
			<ErrorBoundary
				debugName='t2ua2s'
				catch={(it) => <div>{it.error}</div>}
				try={() => [() => state.test]}
			/>
			<hr />
			<LinksComp />
		</>,
	)

	const state = useState('state', {
		test: undefined as TSlotValue,
		title: 'Pick a test',
	})

	useEffect('add hash change listener [t2u5ey]', () => {
		function onHashChange() {
			mutateState($.debugName, 'update comp [t59lhi]', () => {
				const comp = hash__page.get(location.hash)
				state.test = comp ? h(comp, {}) : <NoTestComp />
				state.title = (comp && page__title.get(comp)) ?? 'Pick a test'
			})
		}
		addEventListener('hashchange', onHashChange)
		onHashChange()

		return () => {
			removeEventListener('hashchange', onHashChange)
		}
	})

	return $
})

const LinksComp = defineComponent<{}>('LinksComp', (props, $) => {
	$.append(
		<div>
			<For
				debugName='links'
				each={() => pages}
				render={(it) => (
					<>
						{() => it.index > 0 && ' | '}
						<a href={() => page__hash.get(it.item) ?? ''}>
							<Slot debugName='page' get={() => page__title.get(it.item)} />
						</a>
					</>
				)}
			/>
		</div>,
	)

	return $
})
