import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { errorToMessage } from './errorToMessage'
import { jsonStringify } from './jsonStringify'
import { log1Group, log1GroupEnd, log3 } from './log'
import { minutes } from './minutes'
import { mirror } from './mirror'
import { seconds } from './seconds'
import { stripStack } from './stripStack'
import { useEffect } from './useEffect'
import { useState } from './useState'
import { withInterface } from './withInterface'

export interface IInfo<T, P> {
	name: string
	load: TLoadFn<T, P>
	params: P
	paramsString: string
	staleAfter?: number
	deleteAfter?: number
	lastData?: IDataLoaded<T> | undefined
	data: TData<T>
	states: Set<IUseLoadableState<T>>
}

export type TData<T> =
	| IDataStale<T>
	| IDataLoading<T>
	| IDataLoaded<T>
	| IDataError<T>
	| IDataStaleOffscreen<T>
	| IDataDeleted<T>

export interface IDataStale<T> {
	status: Status.Stale
}

export interface IDataLoading<T> {
	status: Status.Loading
	abort?: () => void
}

export interface IDataLoaded<T> {
	status: Status.Loaded
	data: T
	loadedAt: number
	abort?: () => void
}

export interface IDataError<T> {
	status: Status.Error
	loadedAt: number
	error: string
}

export interface IDataStaleOffscreen<T> {
	status: Status.StaleOffscreen
	abort?: () => void
}

export interface IDataDeleted<T> {
	status: Status.Deleted
}

export type TLoadFn<T, P> = (params: P) => Promise<T>

export interface IUseLoadableOptions<T, P> {
	params: P
	load: TLoadFn<T, P>
	isEnabled?: boolean
	staleAfter?: number
	deleteAfter?: number
}

export interface IUseLoadableState<T> {
	data?: T
	error?: string
	loadedAt?: number
}

const load__param__info = new Map<
	TLoadFn<any, any>,
	Map<string, IInfo<any, any>>
>()

const DEFAULT_STALE_AFTER_MS = seconds(5)
const DEFAULT_DELETE_AFTER_MS = minutes(5)

export const enum Status {
	Stale = 'Stale 🧟',
	Loading = 'Loading ⌚',
	Loaded = 'Loaded 📦',
	Error = 'Error ⚠️',
	StaleOffscreen = 'StaleOffscreen 🏚️',
	Deleted = 'Deleted 🗑️',
}

export function useLoadable<T, P>(
	name: string,
	fn: () => IUseLoadableOptions<T, P>,
): IUseLoadableState<T> {
	const state = useState<IUseLoadableState<T>>(name, {})
	useEffect(name, () => {
		const options = fn()
		if (options.isEnabled === false) return
		const paramsString = jsonStringify(options.params, { ordered: true })
		let doLifecycle = false
		let info = getInfo(options.load, paramsString)
		if (info) {
			// Existing info
			if (info.data.status === Status.StaleOffscreen) info.data.abort?.()
			if (
				info.data.status === Status.Stale ||
				info.data.status === Status.StaleOffscreen ||
				info.data.status === Status.Error
			) {
				log3(
					`☁️ ${info.data.status} → ${Status.Loading} %c${info.name}`,
					HIGHLIGHT,
				)
				info.data = withInterface<IDataLoading<T>>({
					status: Status.Loading,
				})
				doLifecycle = true
			}
		} else {
			// New info
			log3(`☁️ New ✨ → ${Status.Loading} %c${name}`, HIGHLIGHT)
			info = {
				name,
				data: withInterface<IDataLoading<T>>({
					status: Status.Loading,
				}),
				params: JSON.parse(paramsString),
				paramsString,
				load: options.load,
				states: new Set(),
			}
			setInfo(options.load, paramsString, info)
			doLifecycle = true
		}
		info.staleAfter = options.staleAfter
		info.deleteAfter = options.deleteAfter
		info.states.add(state)
		applyState(info)
		if (doLifecycle) nextLifecycle(info)
		return () => {
			info.states.delete(state)
			if (info.states.size === 0) {
				onOffscreen(info)
			}
		}
	})
	return state
}

async function nextLifecycle<T, P>(info: IInfo<T, P>) {
	try {
		let oldStatus = info.data.status
		if (info.data.status === Status.Loading) {
			log3(`☁️ ⌚ ${info.data.status} %c${info.name}`, HIGHLIGHT)
			await loadData(info)
		} else if (info.data.status === Status.Error) {
			log3(`☁️ ✔️ ${info.data.status} %c${info.name}`, HIGHLIGHT)
			return // [swq080]
		} else if (info.data.status === Status.Loaded) {
			log3(`☁️ 💤 ${info.data.status} %c${info.name}`, HIGHLIGHT)
			await waitForStale(info)
		} else if (info.data.status === Status.Stale) {
			log3(`☁️ ✔️ ${info.data.status} %c${info.name}`, HIGHLIGHT)
			return // [swpy4w]
		} else if (info.data.status === Status.StaleOffscreen) {
			log3(`☁️ 💤 ${info.data.status} %c${info.name}`, HIGHLIGHT)
			await waitForDelete(info)
		} else if (info.data.status === Status.Deleted) {
			log3(`☁️ ✔️ ${info.data.status} %c${info.name}`, HIGHLIGHT)
			deleteInfo(info.load, info.paramsString)
			return
		}
		// log3(`☁️ ✍️ ${oldStatus} → ${info.data.status} %c${info.name}`, HIGHLIGHT)
		applyState(info)
		nextLifecycle(info)
	} catch (e) {
		if (e instanceof AbortError) {
			// log3(`☁️ ${info.data.status} 🚫 aborted %c${info.name}`, HIGHLIGHT)
		} else {
			console.error(e)
			console.error(
				`☁️ ${info.data.status} 🛑 error caught in %c${info.name}`,
				HIGHLIGHT,
			)
		}
	}
}

async function loadData<T, P>(info: IInfo<T, P>) {
	if (info.data.status !== Status.Loading) throw new Error(`[swvjit]`)
	let isAborted = false
	info.data.abort = () => {
		log3(`☁️ ${info.data.status} ⌚🚫 aborted %c${info.name}`, HIGHLIGHT)
		isAborted = true
	}
	try {
		const response = await info.load(info.params)
		if (isAborted) throw new AbortError()
		info.lastData = undefined
		info.data = withInterface<IDataLoaded<T>>({
			status: Status.Loaded,
			loadedAt: Date.now(),
			data: response,
		})
	} catch (e) {
		if (isAborted) {
			throw new AbortError()
		}
		stripStack(e)
		console.error(e)
		info.lastData = undefined
		info.data = withInterface<IDataError<T>>({
			status: Status.Error,
			loadedAt: Date.now(),
			error: errorToMessage(e),
		})
	}
}

async function waitForStale<T, P>(info: IInfo<T, P>) {
	await sleep(info, info.staleAfter ?? DEFAULT_STALE_AFTER_MS)
	if (info.data.status === Status.Loaded) {
		info.lastData = info.data
	}
	if (info.states.size) {
		info.data = withInterface<IDataStale<T>>({
			status: Status.Stale,
		})
	} else {
		info.data = withInterface<IDataStaleOffscreen<T>>({
			status: Status.StaleOffscreen,
		})
	}
}

async function waitForDelete<T, P>(info: IInfo<T, P>) {
	await sleep(info, info.deleteAfter ?? DEFAULT_DELETE_AFTER_MS)
	info.data = withInterface<IDataDeleted<T>>({
		status: Status.Deleted,
	})
}

async function onOffscreen<T, P>(info: IInfo<T, P>) {
	if (info.data.status === Status.Stale || info.data.status === Status.Error) {
		log3(
			`☁️ ${info.data.status} → ${Status.StaleOffscreen} %c${info.name}`,
			HIGHLIGHT,
		)
		// [swpy4w] [swq080]
		info.data = withInterface<IDataStaleOffscreen<T>>({
			status: Status.StaleOffscreen,
		})
		nextLifecycle(info)
	}
}

function applyState<T, P>(info: IInfo<T, P>) {
	log1Group(`☁️ ✍️ ${info.data.status} %c${info.name}`, HIGHLIGHT)
	if (!info.data) {
		for (const state of info.states) {
			state.data = undefined
			state.error = undefined
			state.loadedAt = undefined
		}
	} else if (info.data.status === Status.Error) {
		for (const state of info.states) {
			state.data = undefined
			state.error = info.data.error
			state.loadedAt = info.data.loadedAt
		}
	} else if (info.data.status === Status.Loaded) {
		for (const state of info.states) {
			if (info.data.data && state.data) {
				mirror(info.name, info.data.data, state.data)
			} else {
				state.data = info.data.data
			}
			state.error = undefined
			state.loadedAt = info.data.loadedAt
		}
	} else if (
		info.data.status === Status.Loading ||
		info.data.status === Status.Stale ||
		info.data.status === Status.StaleOffscreen
	) {
		for (const state of info.states) {
			if (info.lastData?.data && state.data) {
				mirror(info.name, info.lastData.data, state.data)
			} else {
				state.data = info.lastData?.data
			}
			state.error = undefined
			state.loadedAt = info.lastData?.loadedAt
		}
	}
	log1GroupEnd()
}

function sleep<T, P>(info: IInfo<T, P>, ms: number) {
	return new Promise<void>((resolve, reject) => {
		if (
			info.data.status === Status.Loaded ||
			info.data.status === Status.StaleOffscreen
		) {
			info.data.abort = () => {
				log3(`☁️ ${info.data.status} 💤🚫 aborted %c${info.name}`, HIGHLIGHT)
				clearTimeout(ref)
				reject(new AbortError())
			}
		}
		const ref = setTimeout(resolve, ms)
	})
}

function getInfo<T>(
	load: TLoadFn<T, any>,
	paramsString: string,
): IInfo<T, any> | undefined {
	return load__param__info.get(load)?.get(paramsString)
}

function setInfo<T>(
	load: TLoadFn<T, any>,
	paramsString: string,
	data: IInfo<T, any>,
) {
	let param__data = load__param__info.get(load)
	if (!param__data) {
		param__data = new Map()
		load__param__info.set(load, param__data)
	}
	param__data.set(paramsString, data)
}

function deleteInfo<T>(load: TLoadFn<T, any>, paramsString: string) {
	const param__data = load__param__info.get(load)
	if (param__data) {
		param__data.delete(paramsString)
		if (param__data.size === 0) {
			load__param__info.delete(load)
		}
	}
}

export function makeStale(load: TLoadFn<any, any>, paramsString?: string) {
	const param__info = load__param__info.get(load)
	if (param__info) {
		if (paramsString == null) {
			for (const info of param__info.values()) {
				makeInfoStale(info)
			}
		} else {
			const info = param__info.get(paramsString)
			if (info) makeInfoStale(info)
		}
	}
}

function makeInfoStale<T, P>(info: IInfo<T, P>) {
	let lastStatus = info.data.status
	switch (info.data.status) {
		case Status.Error:
			info.data = info.states.size
				? withInterface<IDataLoading<T>>({
						status: Status.Loading,
				  })
				: withInterface<IDataStaleOffscreen<T>>({
						status: Status.StaleOffscreen,
				  })
			break
		case Status.Loading:
			info.data.abort?.()
			if (info.states.size) {
				info.data = withInterface<IDataLoading<T>>({
					status: Status.Loading,
				})
			} else {
				info.data = withInterface<IDataStaleOffscreen<T>>({
					status: Status.StaleOffscreen,
				})
			}
			break
		case Status.Loaded:
			info.data.abort?.()
			info.lastData = info.data
			if (info.states.size) {
				info.data = withInterface<IDataLoading<T>>({
					status: Status.Loading,
				})
			} else {
				info.data = withInterface<IDataStaleOffscreen<T>>({
					status: Status.StaleOffscreen,
				})
			}
			break
		case Status.Stale:
			info.data = withInterface<IDataLoading<T>>({
				status: Status.Loading,
			})
			break
		default:
			// StaleOffscreen, Deleted
			return
	}
	log3(
		`☁️ ✍️ makeInfoStale ${lastStatus} → ${info.data.status} %c${info.name}`,
		HIGHLIGHT,
	)
	applyState(info)
	nextLifecycle(info)
}

class AbortError extends Error {}
