import { For } from '../c-mp/comp/For'
import { Slot } from '../c-mp/comp/Slot'
import { defineComponent } from '../c-mp/fun/defineComponent'
import { useInfiniteQuery } from '../c-mp/fun/useInfiniteQuery'
import {
	maybeReloadQueriesOnVisible,
	reloadQueries,
	resetQueries,
} from '../c-mp/fun/useQuery'
import { useReloadOnVisible } from '../c-mp/fun/useReloadOnVisible'
import { loadPage } from '../fun/loadPage'

export const UseInfiniteQueryTestComp = defineComponent<{}>(
	'UseInfiniteQueryTestComp',
	(props, $) => {
		const [content, contentHandle] = useInfiniteQuery('content', () => ({
			key: 'loadPage',
			load: loadPage,
			params: {
				foo: true,
				itemsPerPage: 5,
			},
			deleteAfter: 5000,
		}))

		useReloadOnVisible()

		return (
			<>
				<For
					debugName='content pages'
					each={() => content.data?.pages}
					render={({ get, getIndex }) => (
						<fieldset>
							<legend>Page #{getIndex() + ''}</legend>
							<div>
								Status: <Slot get={() => content.status} />
							</div>
							<div>
								Error: <Slot get={() => content.error} />
							</div>
							<div>
								Data: <Slot get={() => JSON.stringify(get().value)} />
							</div>
							<div>
								Loaded at:{' '}
								<Slot
									get={() =>
										content.loadedAt == null
											? ''
											: new Date(content.loadedAt).toLocaleString('hu')
									}
								/>
							</div>
						</fieldset>
					)}
					empty={() => (
						<fieldset>
							<legend>Page #0</legend>
							<div>
								Status: <Slot get={() => content.status} />
							</div>
							<div>
								Error: <Slot get={() => content.error} />
							</div>
							<div>Data: </div>
							<div>Loaded at: </div>
						</fieldset>
					)}
				/>
				<button
					onclick={contentHandle.loadNextPage}
					disabled={() => !contentHandle.hasNextPage()}
				>
					Load more
				</button>
				<button
					onclick={() => {
						maybeReloadQueriesOnVisible('loadPage')
					}}
				>
					Maybe reload
				</button>
				<button
					onclick={() => {
						reloadQueries('loadPage')
					}}
				>
					Reload
				</button>
				<button
					onclick={() => {
						resetQueries('loadPage')
					}}
				>
					Reset
				</button>
			</>
		)
	},
)
