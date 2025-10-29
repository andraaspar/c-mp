import { For } from '../c-mp/comp/For'
import { sleep } from '../c-mp/fun/sleep'
import { Comp, defineComponent } from '../c-mp/fun/useComponent'
import { useEffect } from '../c-mp/fun/useEffect'
import {
	IUseLoadableState,
	reloadLoadables,
	Status,
	TLoadFn,
	useLoadable,
} from '../c-mp/fun/useLoadable'
import { useState } from '../c-mp/fun/useState'

export const UseLoadableInfiniteComp = defineComponent<{}>(
	'UseLoadableInfiniteComp',
	(props, $) => {
		const itemsPerPage = 5
		const serverState = useState('serverState', {
			items: 23,
		})

		async function loadPage(params: { foo: boolean; page: number }) {
			console.log(`[t4ftob] loadPage:`, params.foo)
			await sleep(500)
			const pageCount = Math.max(1, Math.ceil(serverState.items / itemsPerPage))
			const itemsToRender = Math.min(
				itemsPerPage,
				serverState.items - params.page * itemsPerPage,
			)
			console.log(`[t4ftow] loadPage DONE.`)
			return {
				pageCount,
				page: params.page,
				hasMore: pageCount > params.page + 1,
				items: [...Array(itemsToRender).keys()].map(
					(it) => Date.now().toString(36) + '_' + it,
				),
			}
		}
		const content = useInfiniteLoadableState('content')

		$.append(
			<>
				<h1>useLoadable infinite</h1>

				<For
					debugName='pagesFor'
					each={() => content.pages}
					render={(page) => (
						<UseLoadableInfinitePageComp
							index={page.index}
							load={loadPage}
							params={{ foo: true, page: page.index }}
							state={content}
						/>
					)}
				/>
				<button
					onclick={() => {
						content.loadMore()
					}}
					disabled={() => !content.hasMore()}
				>
					Load more
				</button>
				<button
					onclick={() => {
						reloadLoadables(loadPage, (it) => it.page === 0)
					}}
				>
					Reload
				</button>
			</>,
		)

		return $
	},
)

interface IHasMore {
	hasMore: boolean
}
export interface UseLoadableInfiniteState<T> {
	pages: (IUseLoadableState<T> | undefined)[]
	hasMore(): boolean
	loadMore(): void
	dropPagesAfter(index: number): void
}
function useInfiniteLoadableState<T extends IHasMore>(name: string) {
	const pages = useState<(IUseLoadableState<T> | undefined)[]>(
		name + '→pages',
		[],
	)
	const state = {
		pages,
		hasMore(): boolean {
			return pages.at(-1)?.data?.hasMore ?? false
		},
		loadMore() {
			if (pages.length > 0 && !this.hasMore()) return
			pages.push(undefined)
		},
		dropPagesAfter(index: number) {
			console.log(`[t4fthy] dropPagesAfter:`, index)
			pages.length = index + 1
		},
	}

	state.loadMore()

	return state
}

export interface UseLoadableInfinitePageCompProps<T, P> {
	index: number
	load: TLoadFn<T, P>
	params: P
	staleAfter?: number
	deleteAfter?: number
	state: UseLoadableInfiniteState<T>
}
export const UseLoadableInfinitePageComp = defineComponent(
	'UseLoadableInfinitePageComp',
	function <T extends IHasMore, P>(
		props: UseLoadableInfinitePageCompProps<T, P>,
		$: Comp<any>,
	) {
		const content = useLoadable('content', () => ({
			load: props.load,
			params: props.params,
			staleAfter: props.staleAfter,
			deleteAfter: props.deleteAfter,
			isEnabled:
				props.index === 0 ||
				[Status.Loaded, Status.Stale].includes(
					props.state.pages[props.index - 1]?.status ?? Status.Never,
				),
		}))

		// queueMicrotask(() => {
		props.state.pages[props.index] = content
		// })

		useEffect('', () => {
			if (!content.data?.hasMore || content.error) {
				props.state.dropPagesAfter(props.index)
			}
		})

		$.append(
			<fieldset>
				<legend>Page #{props.index + ''}</legend>
				<div>Status: {() => content.status}</div>
				<div>Error: {() => content.error}</div>
				<div>Data: {() => JSON.stringify(content.data)}</div>
				<div>
					Loaded at:{' '}
					{() =>
						content.loadedAt == null
							? ''
							: new Date(content.loadedAt).toLocaleString('hu')
					}
				</div>
			</fieldset>,
		)

		return $
	},
)
