import { unproxify } from './proxify'
import {
	getEntries,
	IUseLoadableOptions,
	Status,
	TLoadFn,
	useLoadable,
} from './useLoadable'

export interface IUsePagedLoadablePage<T> {
	id: number
	value: T
}

export interface IUsePagedLoadableData<T> {
	pages: IUsePagedLoadablePage<T>[]
}

export interface IUsePagedLoadableParam {
	page: number
}

export interface IUsePagedLoadableHasMore {
	hasMore?: boolean
}

export type TUnpagedParams<P> = Omit<P, 'page'>

export function usePagedLoadable<
	T extends IUsePagedLoadableHasMore,
	P extends IUsePagedLoadableParam,
>(
	name: string,
	createOptions: () => IUseLoadableOptions<T, P, TUnpagedParams<P>>,
) {
	let options: IUseLoadableOptions<T, P, TUnpagedParams<P>> | undefined
	const result = useLoadable(name, () => {
		const o = (options = createOptions())

		return {
			...o,
			load: (params) => loadData(o.key, o.load, params),
		}
	})
	return [
		result,
		{
			loadNextPage() {
				if (!options) {
					console.warn(`[t57hyk] loadNextPage called before options was ready.`)
					return
				}
				const entry = getEntries<IUsePagedLoadableData<T>, TUnpagedParams<P>>(
					options.key,
					options.params,
				)[0]
				if (
					entry?.data &&
					(entry.status === Status.Loaded || entry.status === Status.Stale)
				) {
					entry.data.pages.length++
					entry.reload()
				}
			},
			hasNextPage() {
				return !!result.data?.pages.at(-1)?.value.hasMore
			},
		},
	] as const
}

async function loadData<
	T extends IUsePagedLoadableHasMore,
	P extends IUsePagedLoadableParam,
>(
	entryKey: string,
	loadPage: TLoadFn<T, P>,
	params: TUnpagedParams<P>,
): Promise<IUsePagedLoadableData<T>> {
	const entry = getEntries<IUsePagedLoadableData<T>, TUnpagedParams<P>>(
		entryKey,
		params,
	)[0]
	const pageCount = entry?.data?.pages.length ?? 1
	if (entry?.data?.pages && entry.data.pages.at(-1) == null) {
		const pages = unproxify(entry.data.pages).slice(0, -1)
		const value = await loadPage({ ...params, page: pages.length } as P)
		pages.push({ id: pages.length, value })
		return {
			pages,
		}
	} else {
		const pages: IUsePagedLoadablePage<T>[] = []
		for (let page = 0; page < pageCount; page++) {
			const value = await loadPage({ ...params, page } as P)
			pages.push({ id: page, value })
			if (!value?.hasMore) {
				break
			}
		}
		return {
			pages,
		}
	}
}
