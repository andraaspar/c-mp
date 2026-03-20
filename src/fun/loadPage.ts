import { sleep } from '../c-mp/fun/sleep'
import { useState } from '../c-mp/fun/useState'

export const loadPageState = useState('loadPageState', {
	items: 13,
})

export async function loadPage(params: {
	foo: boolean
	page: number
	itemsPerPage: number
}) {
	await sleep(500)
	const pageCount = Math.max(
		1,
		Math.ceil(loadPageState.items / params.itemsPerPage),
	)
	if (params.page < 0 || params.page >= pageCount) {
		throw new Error('Page out of bounds')
	}
	const itemsToRender = Math.min(
		params.itemsPerPage,
		loadPageState.items - params.page * params.itemsPerPage,
	)
	return {
		pageCount,
		page: params.page,
		hasMore: pageCount > params.page + 1,
		items: [...Array(itemsToRender).keys()].map((it) => ({
			value: Date.now().toString(36) + '_' + it,
		})),
	}
}
