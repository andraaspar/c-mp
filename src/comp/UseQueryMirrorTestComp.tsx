import { For } from '../c-mp/comp/For'
import { $when, Show } from '../c-mp/comp/Show'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import {
	maybeReloadQueriesOnVisible,
	reloadQueries,
	resetQueries,
	Status,
	useQuery,
} from '../c-mp/fun/useQuery'
import { useReloadOnVisible } from '../c-mp/fun/useReloadOnVisible'
import { mutateState, useState } from '../c-mp/fun/useState'
import { loadPage } from '../fun/loadPage'

export const UseQueryMirrorTestComp = defineComponent<{}>(
	'UseQueryMirrorTestComp',
	(props, $) => {
		const state = useState('state', { enabled: true, page: 0 })

		const content = useQuery('content', () => ({
			key: 'mirror',
			load: loadPage,
			params: {
				foo: true,
				page: state.page,
				itemsPerPage: 5,
			},
			deleteAfter: 5000,
			isEnabled: state.enabled,
		}))

		useReloadOnVisible()

		return (
			<>
				<button
					onclick={() => {
						mutateState($.debugName, 'toggle enabled [tc76tu]', () => {
							state.enabled = !state.enabled
						})
					}}
				>
					<Slot get={() => (state.enabled ? 'Disable' : 'Enable')} />
				</button>
				<button
					onclick={() => {
						mutateState($.debugName, 'previous page [tc76vx]', () => {
							state.page--
						})
					}}
					disabled={() => state.page === 0}
				>
					Previous page
				</button>
				<span>
					{' '}
					Page: <Slot get={() => (state.page + 1).toString()} /> /{' '}
					<Slot get={() => content.data?.pageCount?.toString() ?? '?'} />{' '}
				</span>
				<button
					onclick={() => {
						mutateState($.debugName, 'next page [tc76w4]', () => {
							state.page++
						})
					}}
					disabled={() => state.page > (content.data?.pageCount || 1) - 1}
				>
					Next page
				</button>
				<button
					onclick={() => {
						maybeReloadQueriesOnVisible('mirror')
					}}
				>
					Maybe reload
				</button>
				<button
					onclick={() => {
						reloadQueries('mirror')
					}}
				>
					Reload
				</button>
				<button
					onclick={() => {
						resetQueries('mirror')
					}}
				>
					Reset
				</button>
				<Show
					it={[
						$when(
							() => content.data?.items,
							() => (
								<For
									debugName='content [tc76qa]'
									each={() => content.data?.items}
									render={({ get }) => (
										<p>
											<Slot get={() => get().value} />
										</p>
									)}
									empty={() => (
										<p>
											<em>No items.</em>
										</p>
									)}
								/>
							),
						),
						$when(
							() => content.status === Status.Loading,
							() => (
								<p>
									<em>Loading...</em>
								</p>
							),
						),
						$when(
							() => content.error,
							() => (
								<p>
									<em>An error occurred.</em>
								</p>
							),
						),
					]}
				/>
			</>
		)
	},
)
