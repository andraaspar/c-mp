import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { errorToMessage } from './errorToMessage'
import { jsonClone } from './jsonClone'
import { jsonStringify } from './jsonStringify'
import { log1Group, log1GroupEnd, log3 } from './log'
import { minutes } from './minutes'
import { mirror } from './mirror'
import { seconds } from './seconds'
import { sleep } from './sleep'
import { stripStack } from './stripStack'
import { untrack, useEffect } from './useEffect'
import { useState } from './useState'
import { withInterface } from './withInterface'

export interface ICacheEntry<T, P> {
	/** Allows us to keep track of the entry in debugging. */
	name: string
	/** The load function used to identify this cache entry. */
	load: TLoadFn<T, P>
	/** The parameters to be fed to the load function. */
	params: P
	/** The parameters serialized for identifying this cache entry. */
	paramsString: string
	/** How long before the entry becomes stale. */
	staleAfter?: number
	/** How long before the stale off-screen entry gets deleted. */
	deleteAfter?: number
	/** The last loaded data, wrapped in a description of its status. */
	data: TData<T>
	/** A state for each of the components using this data. */
	states: Set<IUseLoadableState<T>>
}

export const enum Status {
	Stale = 'Stale 🧟',
	Loading = 'Loading ⌚',
	Loaded = 'Loaded 📦',
	Error = 'Error ⚠️',
	StaleOffscreen = 'StaleOffscreen 🏚️',
	Deleted = 'Deleted 🗑️',
}

export type TData<T> = (
	| IDataStale<T>
	| IDataLoading<T>
	| IDataLoaded<T>
	| IDataError<T>
	| IDataStaleOffscreen<T>
	| IDataDeleted<T>
) & { isStatusHandled?: boolean }

export interface IDataStale<T> {
	status: Status.Stale
	value: T | undefined
	loadedAt: number | undefined
}

export interface IDataLoading<T> {
	status: Status.Loading
	value: T | undefined
	loadedAt: number | undefined
	abortLoading?: () => void
}

export interface IDataLoaded<T> {
	status: Status.Loaded
	value: T
	loadedAt: number
	abortWaitForStale?: () => void
}

export interface IDataError<T> {
	status: Status.Error
	loadedAt: number
	error: string
}

export interface IDataStaleOffscreen<T> {
	status: Status.StaleOffscreen
	value: T | undefined
	loadedAt: number | undefined
	abortWaitForDelete?: () => void
}

export interface IDataDeleted<T> {
	status: Status.Deleted
}

export type TLoadFn<T, P> = (params: P) => Promise<T>

export interface IUseLoadableOptions<T, P> {
	/** Parameters to pass to the load function. */
	params: P
	/** Load and return the data using the parameters. */
	load: TLoadFn<T, P>
	/** Whether to load anything. */
	isEnabled?: boolean
	staleAfter?: number
	deleteAfter?: number
}

export interface IUseLoadableState<T> {
	data?: T
	error?: string
	loadedAt?: number
}

/** The cache. */
const load__param__entry = new Map<
	TLoadFn<any, any>,
	Map<string, ICacheEntry<any, any>>
>()

const DEFAULT_STALE_AFTER_MS = seconds(5)
const DEFAULT_DELETE_AFTER_MS = minutes(5)

export function useLoadable<T, P>(
	name: string,
	createOptions: () => IUseLoadableOptions<T, P>,
): IUseLoadableState<T> {
	const state = useState<IUseLoadableState<T>>(name, {})

	// Declare effect to keep track of changes in dependencies.
	useEffect(name, () => {
		// Create the options in the effect to track dependencies.
		const options = createOptions()

		return untrack(name, () => {
			// The params as a string will be key to get the entry.
			const paramsString = jsonStringify(options.params, { ordered: true })

			let entry = load__param__entry.get(options.load)?.get(paramsString)
			if (entry) {
				// Existing entry:
				if (
					entry.data.status === Status.Loaded ||
					entry.data.status === Status.Loading
				) {
					// Use the data for loaded and loading as they will not change.
					// [t37df7]
					state.data = jsonClone(entry.data.value)
					state.error = undefined
					state.loadedAt = entry.data.loadedAt
				}
			} else {
				// New entry: the data is not in the cache.

				log3(`☁️ New ✨ → ${Status.Loading} %c${name}`, HIGHLIGHT)

				// Create new entry.
				entry = {
					name,
					data: withInterface<IDataLoading<T> | IDataStale<T>>({
						status: options.isEnabled ? Status.Loading : Status.Stale,
						value: undefined,
						loadedAt: undefined,
					}),
					params: JSON.parse(paramsString),
					paramsString,
					load: options.load,
					states: new Set(),
					staleAfter: options.staleAfter,
					deleteAfter: options.deleteAfter,
				}

				// Store it.
				storeCacheEntry(options.load, paramsString, entry)

				// Erase all the state coming from a potential earlier cache entry,
				// from before the options changed. [t37ep0]
				state.data = undefined
				state.error = undefined
				state.loadedAt = undefined
			}

			// If stale off-screen, stop unloading the data.
			if (entry.data.status === Status.StaleOffscreen) {
				entry.data.abortWaitForDelete?.()
			}
			// If not loading or loaded, start loading. [t37df7]
			if (options.isEnabled) {
				if (
					entry.data.status !== Status.Loaded &&
					entry.data.status !== Status.Loading
				) {
					log3(
						`☁️ ${entry.data.status} → ${Status.Loading} %c${entry.name}`,
						HIGHLIGHT,
					)

					entry.data = withInterface<IDataLoading<T>>({
						status: Status.Loading,
						value:
							entry.data.status === Status.Stale ||
							entry.data.status === Status.StaleOffscreen
								? entry.data.value
								: undefined,
						loadedAt:
							entry.data.status === Status.Stale ||
							entry.data.status === Status.StaleOffscreen
								? entry.data.loadedAt
								: undefined,
					})

					// [t37ep0]
					mirrorData(entry.name, entry.data.value, state)
					state.error = undefined
					state.loadedAt = entry.data.loadedAt
				}
			} else {
				// Paused.

				if (entry.data.status === Status.StaleOffscreen) {
					// Stale off-screen should become simply stale.
					entry.data.abortWaitForDelete?.()
					entry.data = withInterface<IDataStale<T>>({
						status: Status.Stale,
						value: entry.data.value,
						loadedAt: entry.data.loadedAt,
					})
				}

				// Make sure the state still gets the data correctly. [t37g0n]
				if ('value' in entry.data) {
					mirrorData(entry.name, entry.data.value, state)
				} else {
					state.data = undefined
				}
				state.error = 'error' in entry.data ? entry.data.error : undefined
				state.loadedAt =
					'loadedAt' in entry.data ? entry.data.loadedAt : undefined
			}

			// Register the current component as a watcher.
			entry.states.add(state)

			// Start handling the new status asynchronously, detached from the current
			// function.
			handleStatus(entry)

			// When the component is removed:
			return () => {
				// Remove the watching of the data.
				entry.states.delete(state)

				// If this was the last component watching:
				if (entry.states.size === 0) {
					// If the data was already stale or had an error loading:
					if (
						entry.data.status === Status.Stale ||
						entry.data.status === Status.Error
					) {
						log3(
							`☁️ ${entry.data.status} → ${Status.StaleOffscreen} %c${entry.name}`,
							HIGHLIGHT,
						)

						// Skip status to stale off-screen. [swpy4w] [swq080]
						entry.data = withInterface<IDataStaleOffscreen<T>>({
							status: Status.StaleOffscreen,
							value:
								entry.data.status === Status.Stale
									? entry.data.value
									: undefined,
							loadedAt:
								entry.data.status === Status.Stale
									? entry.data.loadedAt
									: undefined,
						})

						// Handle the new status.
						handleStatus(entry)
					}
				}
			}
		})
	})

	return state
}

async function handleStatus<T, P>(entry: ICacheEntry<T, P>) {
	// Each status must be handled only once.
	if (entry.data.isStatusHandled) return
	entry.data.isStatusHandled = true

	try {
		// let oldStatus = entry.data.status
		if (entry.data.status === Status.Loading) {
			// Loading is requested:

			// No need to update states, the data has not changed, and the state has
			// been already updated by this point if the options changed. [t37ep0]

			log3(`☁️ ⌚ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// Set up abort handling.
			let isAborted = false
			entry.data.abortLoading = () => {
				log3(`☁️ ${entry.data.status} ⌚🚫 aborted %c${entry.name}`, HIGHLIGHT)
				isAborted = true
			}

			try {
				// Attempt to get the response.
				const response = await entry.load(entry.params)

				// If loading was aborted, throw.
				if (isAborted) throw new AbortError()

				// Store the new data.
				entry.data = withInterface<IDataLoaded<T>>({
					status: Status.Loaded,
					loadedAt: Date.now(),
					value: response,
				})
			} catch (e) {
				if (isAborted) {
					throw new AbortError()
				}

				// Strip the c-mp framework from the stack trace.
				stripStack(e)

				console.error(e)

				// Store error.
				entry.data = withInterface<IDataError<T>>({
					status: Status.Error,
					loadedAt: Date.now(),
					error: errorToMessage(e),
				})
			}
		} else if (entry.data.status === Status.Error) {
			// An error was caught:

			// Update states.
			log1Group(`☁️ ✍️ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)
			for (const state of entry.states) {
				// Show the error.
				state.data = undefined
				state.error = entry.data.error
				state.loadedAt = entry.data.loadedAt
			}
			log1GroupEnd()

			log3(`☁️ ✔️ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// There is no next status. [swq080]
			return
		} else if (entry.data.status === Status.Loaded) {
			// New data was loaded successfully.

			// Update states.
			log1Group(`☁️ ✍️ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)
			for (const state of entry.states) {
				mirrorData(entry.name, entry.data.value, state)
				state.error = undefined
				state.loadedAt = entry.data.loadedAt
			}
			log1GroupEnd()

			log3(`☁️ 💤 ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// Set up abort handling for the wait for stale.
			let abort: (() => void) | undefined
			entry.data.abortWaitForStale = () => {
				log3(
					`☁️ ${entry.data.status} 💤🚫 aborted wait for stale %c${entry.name}`,
					HIGHLIGHT,
				)
				abort?.()
			}

			// Sleep until the data becomes stale.
			await sleep(
				entry.staleAfter ?? DEFAULT_STALE_AFTER_MS,
				(it) => (abort = it),
			)

			if (entry.states) {
				// If the data is on screen, mark it as stale.
				entry.data = withInterface<IDataStale<T>>({
					status: Status.Stale,
					value: entry.data.value,
					loadedAt: entry.data.loadedAt,
				})
			} else {
				// If the data is not on screen, mark it as stale off-screen.
				entry.data = withInterface<IDataStaleOffscreen<T>>({
					status: Status.StaleOffscreen,
					value: entry.data.value,
					loadedAt: entry.data.loadedAt,
				})
			}
		} else if (entry.data.status === Status.Stale) {
			// The data became stale:

			log3(`☁️ ✔️ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// No need to update states, the data has not changed, and the state has
			// been already updated by this point if the options changed. [t37g0n]

			// There is no next status. Either it will be reloaded, or it will go
			// off-screen. [swpy4w]
			return
		} else if (entry.data.status === Status.StaleOffscreen) {
			// The data became stale and is no longer on-screen:

			log3(`☁️ 💤 ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// No need to update states, the data has not changed, and it is not
			// possible to reach this state when switching from a different options.

			// Set up abort handling for the wait for delete.
			let abort: (() => void) | undefined
			entry.data.abortWaitForDelete = () => {
				log3(
					`☁️ ${entry.data.status} 💤🚫 aborted wait for delete %c${entry.name}`,
					HIGHLIGHT,
				)
				abort?.()
			}

			// Sleep until it is ready to delete.
			await sleep(
				entry.deleteAfter ?? DEFAULT_DELETE_AFTER_MS,
				(it) => (abort = it),
			)

			// Set it to deleted.
			entry.data = withInterface<IDataDeleted<T>>({
				status: Status.Deleted,
			})
		} else if (entry.data.status === Status.Deleted) {
			// The data was marked for deletion:

			log3(`☁️ ✔️ ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

			// No need to update states, we should not have any.

			deleteCacheEntry(entry.load, entry.paramsString)
			return
		}
		// log3(`☁️ ✍️ ${oldStatus} → ${entry.data.status} %c${entry.name}`, HIGHLIGHT)

		// Handle the updated status.
		handleStatus(entry)
	} catch (e) {
		if (e instanceof AbortError) {
			// log3(`☁️ ${entry.data.status} 🚫 aborted %c${entry.name}`, HIGHLIGHT)
			// Aborting need not be reported.
		} else {
			console.error(e)
			console.error(
				`☁️ ${entry.data.status} 🛑 error caught in %c${entry.name}`,
				HIGHLIGHT,
			)
		}
	}
}

function mirrorData<T, P>(name: string, data: T, state: IUseLoadableState<T>) {
	if (data && state.data) {
		// We already had data: mutate it to reflect the updated data.
		mirror(name, data, state.data)
	} else {
		// We had no data before: clone the loaded data and proxify it.
		state.data = jsonClone(data)
	}
}

function storeCacheEntry<T>(
	load: TLoadFn<T, any>,
	paramsString: string,
	data: ICacheEntry<T, any>,
) {
	let param__data = load__param__entry.get(load)
	if (!param__data) {
		param__data = new Map()
		load__param__entry.set(load, param__data)
	}
	param__data.set(paramsString, data)
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

export function reloadLoadables<T, P>(
	load?: TLoadFn<T, P>,
	paramsPredicate?: (params: P) => boolean,
) {
	let param__entrys: Map<string, ICacheEntry<any, any>>[]
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
			// Otherwise only those for which it returns true. [t378vu]
			if (paramsPredicate?.(entry.params) ?? true) {
				reloadCacheEntry(entry)
			}
		}
	}
}

function reloadCacheEntry<T, P>(entry: ICacheEntry<T, P>) {
	let lastStatus = entry.data.status
	switch (entry.data.status) {
		case Status.Error:
			// It was in an error state, it is time to load again.
			entry.data = withInterface<IDataLoading<T>>({
				status: Status.Loading,
				value: undefined,
				loadedAt: undefined,
			})
			break
		case Status.Loading:
			// It is loading, but we mutated it, so it has a chance to come back
			// invalid. Time to abort.
			entry.data.abortLoading?.()
			// Let it load again.
			entry.data = withInterface<IDataLoading<T>>({
				status: Status.Loading,
				value: entry.data.value,
				loadedAt: entry.data.loadedAt,
			})
			break
		case Status.Loaded:
			// It was loaded, but the data is stale now. Time to load again.
			entry.data.abortWaitForStale?.()
			// Let it load again.
			entry.data = withInterface<IDataLoading<T>>({
				status: Status.Loading,
				value: entry.data.value,
				loadedAt: entry.data.loadedAt,
			})
			break
		case Status.Stale:
			// It was stale, now it should load again.
			entry.data = withInterface<IDataLoading<T>>({
				status: Status.Loading,
				value: entry.data.value,
				loadedAt: entry.data.loadedAt,
			})
			break
		default:
			// Stale off-screen or deleted statuses: no action.
			return
	}
	log3(
		`☁️ ✍️ makeCacheEntryStale ${lastStatus} → ${entry.data.status} %c${entry.name}`,
		HIGHLIGHT,
	)
	handleStatus(entry)
}

export class AbortError extends Error {}
