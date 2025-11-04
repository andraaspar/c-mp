import { For } from '../c-mp/comp/For'
import { defineComponent } from '../c-mp/fun/useComponent'
import { reloadLoadables } from '../c-mp/fun/useLoadable'
import { usePagedLoadable } from '../c-mp/fun/usePagedLoadable'
import { useReloadOnVisibleEffect } from '../c-mp/fun/useReloadOnVisibleEffect'
import { loadPage } from '../fun/loadPage'

export const UsePagedLoadableTestComp = defineComponent<{}>(
	'UsePagedLoadableTestComp',
	(props, $) => {
		const [content, contentHandle] = usePagedLoadable('content', () => ({
			key: 'hey',
			load: loadPage,
			params: {
				foo: true,
				itemsPerPage: 5,
			},
			deleteAfter: 5000,
		}))

		useReloadOnVisibleEffect()

		$.append(
			<>
				<h1>usePagedLoadable</h1>

				<For
					each={() => content.data?.pages}
					render={(page) => (
						<fieldset>
							<legend>Page #{page.index + ''}</legend>
							<div>Status: {() => content.status}</div>
							<div>Error: {() => content.error}</div>
							<div>Data: {() => JSON.stringify(page.item.value)}</div>
							<div>
								Loaded at:{' '}
								{() =>
									content.loadedAt == null
										? ''
										: new Date(content.loadedAt).toLocaleString('hu')
								}
							</div>
						</fieldset>
					)}
					empty={() => (
						<fieldset>
							<legend>Page #0</legend>
							<div>Status: {() => content.status}</div>
							<div>Error: {() => content.error}</div>
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
						reloadLoadables('hey')
					}}
				>
					Reload
				</button>
			</>,
		)

		return $
	},
)
