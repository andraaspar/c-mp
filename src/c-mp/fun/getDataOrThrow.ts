import { appState } from '../../model/appState'

export function getDataOrThrow() {
	const it = appState.data
	if (!it) throw new Error(`[tact2x] Data not defined.`)
	return it
}
