import { AbortError } from '../model/AbortError'
import { activeComps } from './defineComponent'
import { errorToMessage } from './errorToMessage'
import { jsonClone } from './jsonClone'
import { jsonStringify } from './jsonStringify'
import { logLevel } from './log'
import { minutes } from './minutes'
import { mirror } from './mirror'
import { seconds } from './seconds'
import { sleep } from './sleep'
import { untrack, useEffect } from './useEffect'
import { mutateState, useState } from './useState'

export type TLoadFn<T, P> = (params: P) => Promise<T>

export interface IUseQueryOptions<T, PLoad, PIn = PLoad> {
	/** Key to identify this query. */
	key: string
	/** Parameters to pass to the load function. */
	params: PIn
	/** Load and return the data using the parameters. */
	load: TLoadFn<T, PLoad>
	/** Whether to trigger loading by this instance. */
	isEnabled?: boolean
	/** How long before the loaded data is considered stale. */
	staleAfter?: number
	/** How long before stale off-screen data should be deleted. */
	deleteAfter?: number
	/** Skip reloading when visibility changes. */
	noReloadOnVisible?: boolean
}

export interface IUseQueryState<T> {
	name: string
	status: Status
	data?: T
	error?: string
	loadedAt?: number
}

export const enum Status {
	Never = 'Never 🕳️',
	Loading = 'Loading ⌚',
	Loaded = 'Loaded 📦',
	Stale = 'Stale 🧟',
	Error = 'Error ⚠️',
	Deleted = 'Deleted 🗑️',
}

const DEFAULT_STALE_AFTER_MS = seconds(5)
const DEFAULT_DELETE_AFTER_MS = minutes(5)

export interface ICacheEntryParams<T, P> {
	key: string
	load: TLoadFn<T, P>
	params: P
	paramsString: string
	staleAfter?: number
	deleteAfter?: number
	noReloadOnVisible?: boolean
}

export class CacheEntry<T, P> {
	/** Key to identify this entry. */
	readonly key: string
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
	/** Skip reloading when visibility changes. */
	readonly noReloadOnVisible: boolean
	status = Status.Never
	data?: T
	loadedAt?: number
	error?: string
	/** A state for each of the components using this data. */
	readonly states = new Set<IUseQueryState<T>>()
	private enabledCount = 0
	private abortFn?: () => void
	private abortWaitForDelete?: () => void

	constructor(o: ICacheEntryParams<T, P>) {
		this.key = o.key
		this.loadFn = o.load
		this.params = o.params
		this.paramsString = o.paramsString
		this.staleAfter = o.staleAfter ?? DEFAULT_STALE_AFTER_MS
		this.deleteAfter = o.deleteAfter ?? DEFAULT_DELETE_AFTER_MS
		this.noReloadOnVisible = o.noReloadOnVisible || false
	}

	private setStatus(
		status: Status,
		data: T | undefined,
		loadedAt: number | undefined,
		error?: string,
	) {
		if (this.status === Status.Deleted) return
		const oldStatus = this.status
		if (logLevel >= 2) {
			console.debug(`🔰 ☁️ ${this.key} ${oldStatus} ✏️ ${status}`)
		}

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
		if (logLevel >= 2) {
			console.debug(`🛑 ☁️ ${this.key} ${oldStatus} ✏️ ${status}`)
		}
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
					`Error loading ${JSON.stringify(this.key)} with params ${
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

	addState(state: IUseQueryState<T>, isEnabled: boolean) {
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
				if (logLevel >= 2)
					console.debug(`⛔`, JSON.stringify(this.key), `observed.`)
			}
		}
	}

	private updateState(state: IUseQueryState<T>, dataChanged = true) {
		mutateState('☁️ ' + this.key, `👉 ${state.name} (${this.status})`, () => {
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
					mirror(this.key, this.data, state.data)
				}
			} else {
				// We had no data before: clone the loaded data and proxify it.
				state.data = jsonClone(this.data)
			}
			state.loadedAt = this.loadedAt
			state.error = this.error
		})
	}

	deleteState(state: IUseQueryState<T>, isEnabled: boolean) {
		this.states.delete(state)
		if (isEnabled) this.enabledCount--

		if (this.states.size === 0) {
			this.waitForDelete()
		}
	}

	private delete() {
		deleteCacheEntry(this.key, this.paramsString)
	}

	/** Marks loaded states stale, and aborts loading states so they become either
	 * stale or never loaded. */
	makeStaleOrNever() {
		if (this.status === Status.Loaded) {
			this.setStatus(Status.Stale, this.data, this.loadedAt)
			return true
		} else if (this.status === Status.Loading) {
			if (this.data) {
				this.setStatus(Status.Stale, this.data, this.loadedAt)
			} else {
				this.setStatus(Status.Never, undefined, undefined)
			}
			return true
		}
		return false
	}

	/** Reloads data, regardless of whether any states are enabled. */
	reload() {
		if (this.status !== Status.Deleted) {
			this.setStatus(Status.Loading, this.data, this.loadedAt)
			return true
		}
		return false
	}

	/** Reloads data if not opted out and enabled, and status is stale or error or
	 * never. Suitable for reloading data on visibility change. */
	maybeReloadOnVisible() {
		if (
			!this.noReloadOnVisible &&
			this.enabledCount > 0 &&
			(this.status === Status.Stale ||
				this.status === Status.Error ||
				this.status === Status.Never)
		) {
			this.setStatus(Status.Loading, this.data, this.loadedAt)
			return true
		}
		return false
	}
}

/** The cache. */
const key__param__entry = new Map<string, Map<string, CacheEntry<any, any>>>()

function storeCacheEntry<T>(entry: CacheEntry<T, any>) {
	let param__data = key__param__entry.get(entry.key)
	if (!param__data) {
		param__data = new Map()
		key__param__entry.set(entry.key, param__data)
	}
	param__data.set(entry.paramsString, entry)
}

function deleteCacheEntry<T>(key: string, paramsString: string) {
	const param__data = key__param__entry.get(key)
	if (param__data) {
		param__data.delete(paramsString)
		if (param__data.size === 0) {
			key__param__entry.delete(key)
		}
	}
}

export function useQuery<T, P>(
	name: string,
	createOptions: () => IUseQueryOptions<T, P>,
): IUseQueryState<T> {
	const debugName = activeComps.at(-1)!.debugName + ` → ${name}`
	const state = useState<IUseQueryState<T>>(
		`state`,
		{ name: debugName, status: Status.Never },
		debugName,
	)

	const innerState = useState(
		'innerState',
		{
			entryRef: undefined as CacheEntry<T, P> | undefined,
			isEnabled: false,
		},
		debugName,
	)

	// Declare effect to keep track of changes in dependencies.
	useEffect(
		'options changed [t6e0aa]',
		() => {
			// Create the options in the effect to track dependencies.
			const options = createOptions()

			return untrack('apply [t6e0ai]', () => {
				// The params as a string will be key to get the entry.
				const paramsString = jsonStringify(options.params, { ordered: true })
				// Look up the entry in the cache.
				let entry = key__param__entry.get(options.key)?.get(paramsString)
				// If not found:
				if (!entry) {
					// Create new entry.
					entry = new CacheEntry({
						key: options.key,
						load: options.load,
						params: options.params,
						paramsString: paramsString,
						deleteAfter: options.deleteAfter,
						staleAfter: options.staleAfter,
						noReloadOnVisible: options.noReloadOnVisible,
					})
					storeCacheEntry(entry)
				}
				mutateState(
					debugName,
					`→ untrackOptionsEffect update innerState [t6c1bq]`,
					() => {
						innerState.isEnabled = options.isEnabled ?? true
						innerState.entryRef = entry
					},
				)
			})
		},
		debugName,
	)

	useEffect(
		'entry changed [t6e0as]',
		() => {
			const entry = innerState.entryRef
			if (entry != null) {
				entry.addState(state, innerState.isEnabled)

				return () => {
					entry.deleteState(state, innerState.isEnabled)
				}
			}
		},
		debugName,
	)

	return state
}

export function getEntries<T, P>(
	key?: string,
	paramsPredicate: P | ((params: P) => boolean) | boolean = true,
): CacheEntry<T, P>[] {
	const paramsPredicateString =
		paramsPredicate && typeof paramsPredicate === 'object'
			? jsonStringify(paramsPredicate, { ordered: true })
			: undefined
	if (key != null && paramsPredicateString) {
		const entry = key__param__entry.get(key)?.get(paramsPredicateString)
		return entry ? [entry] : []
	}
	const paramsPredicateFn =
		typeof paramsPredicate === 'function'
			? (paramsPredicate as (params: P) => boolean)
			: undefined
	let param__entrys: Map<string, CacheEntry<any, any>>[]
	if (key != null) {
		const param__entry = key__param__entry.get(key)
		if (param__entry) {
			param__entrys = [param__entry]
		} else {
			return []
		}
	} else {
		param__entrys = Array.from(key__param__entry.values())
	}
	const result = []
	for (const param__entry of param__entrys) {
		for (const entry of param__entry.values()) {
			if (
				paramsPredicateString
					? paramsPredicateString === entry.paramsString
					: paramsPredicateFn
					? paramsPredicateFn(entry.params)
					: paramsPredicate
			) {
				result.push(entry)
			}
		}
	}
	return result
}

export function reloadQueries<T, P>(
	key?: string,
	paramsPredicate?: (params: P) => boolean,
) {
	console.debug(`🔰 ☁️ reload`, key, paramsPredicate)
	let result = 0
	const entries = getEntries(key, paramsPredicate)
	for (const entry of entries) {
		if (entry.reload()) {
			result++
		}
	}
	console.debug(`🛑 ☁️ reload`, key, paramsPredicate, result)
	return result
}

export function resetQueries<T, P>(
	key?: string,
	paramsPredicate?: (params: P) => boolean,
) {
	console.debug(`🔰 ☁️ reload`, key, paramsPredicate)
	let result = 0
	const entries = getEntries(key, paramsPredicate)
	for (const entry of entries) {
		if (entry.makeStaleOrNever() && entry.maybeReloadOnVisible()) {
			result++
		}
	}
	console.debug(`🛑 ☁️ reload`, key, paramsPredicate, result)
	return result
}

export function maybeReloadQueriesOnVisible<T, P>(
	key?: string,
	paramsPredicate?: (params: P) => boolean,
) {
	console.debug(`🔰 ☁️ maybe reload on visible`, key, paramsPredicate)
	let result = 0
	const entries = getEntries(key, paramsPredicate)
	for (const entry of entries) {
		if (entry.maybeReloadOnVisible()) {
			result++
		}
	}
	console.debug(`🛑 ☁️ maybe reload on visible`, key, paramsPredicate, result)
	return result
}
