import { AbortError } from '../model/AbortError'
import { errorToMessage } from './errorToMessage'
import { jsonClone } from './jsonClone'
import { jsonStringify } from './jsonStringify'
import { log1, log2Group, log2GroupEnd } from './log'
import { minutes } from './minutes'
import { mirror } from './mirror'
import { seconds } from './seconds'
import { sleep } from './sleep'
import { untrack, useEffect } from './useEffect'
import { useState } from './useState'

export type TLoadFn<T, P> = (params: P) => Promise<T>

export interface IUseLoadableOptions<T, P> {
	/** Parameters to pass to the load function. */
	params: P
	/** Load and return the data using the parameters. */
	load: TLoadFn<T, P>
	/** Whether to trigger loading by this instance. */
	isEnabled?: boolean
	/** How long before the loaded data is considered stale. */
	staleAfter?: number
	/** How long before stale off-screen data should be deleted. */
	deleteAfter?: number
}

export interface IUseLoadableState<T> {
	status: Status
	data?: T
	error?: string
	loadedAt?: number
}

export const enum Status {
	Never = 'Never 🕳️',
	Stale = 'Stale 🧟',
	Loading = 'Loading ⌚',
	Loaded = 'Loaded 📦',
	Error = 'Error ⚠️',
	Deleted = 'Deleted 🗑️',
}

const DEFAULT_STALE_AFTER_MS = seconds(5)
const DEFAULT_DELETE_AFTER_MS = minutes(5)

export interface ICacheEntryParams<T, P> {
	name: string
	load: TLoadFn<T, P>
	params: P
	paramsString: string
	staleAfter?: number
	deleteAfter?: number
}

export class CacheEntry<T, P> {
	/** Allows us to keep track of the entry in debugging. */
	readonly name: string
	/** The load function used to identify this cache entry. */
	readonly loadFn: TLoadFn<T, P>
	/** The parameters to be fed to the load function. */
	readonly params: P
	/** The parameters serialized for identifying this cache entry. */
	readonly paramsString: string
	/** How long before the entry becomes stale. */
	readonly staleAfter: number
	/** How long before the stale off-screen entry gets deleted. */
	readonly deleteAfter: number
	status = Status.Never
	data?: T
	loadedAt?: number
	error?: string
	/** A state for each of the components using this data. */
	readonly states = new Set<IUseLoadableState<T>>()
	enabledCount = 0
	private abortFn?: () => void
	private abortWaitForDelete?: () => void

	constructor(o: ICacheEntryParams<T, P>) {
		this.name = o.name
		this.loadFn = o.load
		this.params = o.params
		this.paramsString = o.paramsString
		this.staleAfter = o.staleAfter ?? DEFAULT_STALE_AFTER_MS
		this.deleteAfter = o.deleteAfter ?? DEFAULT_DELETE_AFTER_MS
	}

	private setStatus(
		status: Status,
		data: T | undefined,
		loadedAt: number | undefined,
		error?: string,
	) {
		if (this.status === Status.Deleted) return

		log2Group(`☁️ ${this.name} ${status}`)

		// log1(`data:`, data)
		// log1(`loadedAt:`, loadedAt)
		// log1(`error:`, error)

		// const oldStatus = this.status
		const dataChanged = !Object.is(data, this.data)
		this.status = status
		this.data = data
		this.loadedAt = loadedAt
		this.error = error

		for (const state of this.states) {
			this.updateState(state, dataChanged)
		}

		this.abortFn?.()
		this.abortFn = undefined

		if (status === Status.Loading) {
			this.load()
		} else if (status === Status.Loaded) {
			this.waitForStale()
		} else if (status === Status.Deleted) {
			this.delete()
		}
		log2GroupEnd()
	}

	private async load() {
		try {
			let isAborted = false
			this.abortFn = () => {
				isAborted = true
			}

			const value = await this.loadFn(this.params)
			if (isAborted) throw new AbortError()

			this.setStatus(Status.Loaded, value, Date.now())
		} catch (e) {
			if (!(e instanceof AbortError)) {
				console.error(
					`Error loading ${JSON.stringify(this.name)} with params ${
						this.paramsString
					}:`,
					e,
				)
				this.setStatus(Status.Error, undefined, Date.now(), errorToMessage(e))
			}
		}
	}

	private async waitForStale() {
		try {
			await sleep(this.staleAfter, (it) => {
				this.abortFn = it
			})
			this.setStatus(Status.Stale, this.data, this.loadedAt)
		} catch (e) {
			if (!(e instanceof AbortError)) {
				console.error(e)
			}
		}
	}

	private async waitForDelete() {
		try {
			await sleep(this.deleteAfter, (it) => {
				this.abortWaitForDelete = it
			})
			this.setStatus(Status.Deleted, this.data, this.loadedAt)
		} catch (e) {
			if (!(e instanceof AbortError)) {
				console.error(e)
			}
		}
	}

	addState(state: IUseLoadableState<T>, isEnabled: boolean) {
		this.states.add(state)
		if (isEnabled) this.enabledCount++

		this.updateState(state)

		this.abortWaitForDelete?.()
		this.abortWaitForDelete = undefined

		if (
			this.status === Status.Error ||
			this.status === Status.Stale ||
			this.status === Status.Never
		) {
			if (isEnabled) {
				this.setStatus(Status.Loading, this.data, this.loadedAt)
			} else {
				log1(`⛔`, this.name, `observed.`)
			}
		}
	}

	updateState(state: IUseLoadableState<T>, dataChanged = true) {
		state.status = this.status
		// state.data = data
		if (
			this.data != null &&
			typeof this.data === 'object' &&
			state.data != null &&
			typeof state.data === 'object'
		) {
			// We already had data: mutate it to reflect the updated data.
			if (dataChanged) {
				mirror(this.name, this.data, state.data)
			}
		} else {
			// We had no data before: clone the loaded data and proxify it.
			state.data = jsonClone(this.data)
		}
		state.loadedAt = this.loadedAt
		state.error = this.error
	}

	deleteState(state: IUseLoadableState<T>, isEnabled: boolean) {
		this.states.delete(state)
		if (isEnabled) this.enabledCount--

		if (this.states.size === 0) {
			this.waitForDelete()
		}
	}

	delete() {
		deleteCacheEntry(this.loadFn, this.paramsString)
	}

	reload() {
		if (this.enabledCount === 0) return
		this.setStatus(Status.Loading, this.data, this.loadedAt)
	}
}

/** The cache. */
const load__param__entry = new Map<
	TLoadFn<any, any>,
	Map<string, CacheEntry<any, any>>
>()

function storeCacheEntry<T>(entry: CacheEntry<T, any>) {
	let param__data = load__param__entry.get(entry.loadFn)
	if (!param__data) {
		param__data = new Map()
		load__param__entry.set(entry.loadFn, param__data)
	}
	param__data.set(entry.paramsString, entry)
}

function deleteCacheEntry<T>(load: TLoadFn<T, any>, paramsString: string) {
	const param__data = load__param__entry.get(load)
	if (param__data) {
		param__data.delete(paramsString)
		if (param__data.size === 0) {
			load__param__entry.delete(load)
		}
	}
}

export function useLoadable<T, P>(
	name: string,
	createOptions: () => IUseLoadableOptions<T, P>,
): IUseLoadableState<T> {
	const state = useState<IUseLoadableState<T>>(name, { status: Status.Never })

	const innerState = useState(name + '.innerState', {
		entryRef: undefined as CacheEntry<T, P> | undefined,
		isEnabled: false,
	})

	// Declare effect to keep track of changes in dependencies.
	useEffect(name + '→optionsEffect', () => {
		// Create the options in the effect to track dependencies.
		const options = createOptions()

		return untrack(name, () => {
			// The params as a string will be key to get the entry.
			const paramsString = jsonStringify(options.params, { ordered: true })
			// Look up the entry in the cache.
			let entry = load__param__entry.get(options.load)?.get(paramsString)
			// If not found:
			if (!entry) {
				// Create new entry.
				entry = new CacheEntry({
					name: name,
					load: options.load,
					params: options.params,
					paramsString: paramsString,
					deleteAfter: options.deleteAfter,
					staleAfter: options.staleAfter,
				})
				storeCacheEntry(entry)
			}
			innerState.isEnabled = options.isEnabled ?? true
			innerState.entryRef = entry
		})
	})

	useEffect(name + '→entryEffect', () => {
		const entry = innerState.entryRef
		if (entry != null) {
			entry.addState(state, innerState.isEnabled)

			return () => {
				entry.deleteState(state, innerState.isEnabled)
			}
		}
	})

	return state
}

export function reloadLoadables<T, P>(
	load?: TLoadFn<T, P>,
	paramsPredicate?: (params: P) => boolean,
) {
	let param__entrys: Map<string, CacheEntry<any, any>>[]
	if (load) {
		const param__entry = load__param__entry.get(load)
		if (param__entry) {
			param__entrys = [param__entry]
		} else {
			return
		}
	} else {
		param__entrys = Array.from(load__param__entry.values())
	}
	for (const param__entry of param__entrys) {
		for (const entry of param__entry.values()) {
			// If the predicate is not provided, we reload each entry we find.
			// Otherwise only those for which it returns true.
			if (paramsPredicate?.(entry.params) ?? true) {
				entry.reload()
			}
		}
	}
}
