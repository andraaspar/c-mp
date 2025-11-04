import { sleep } from '../c-mp/fun/sleep'
import { useState } from '../c-mp/fun/useState'

export const loadPageState = useState('loadPageState', {
	items: 23,
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
	const itemsToRender = Math.min(
		params.itemsPerPage,
		loadPageState.items - params.page * params.itemsPerPage,
	)
	return {
		pageCount,
		page: params.page,
		hasMore: pageCount > params.page + 1,
		items: [...Array(itemsToRender).keys()].map(
			(it) => Date.now().toString(36) + '_' + it,
		),
	}
}
