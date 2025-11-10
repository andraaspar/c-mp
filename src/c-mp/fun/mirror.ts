import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { logLevel } from './log'
import { unproxify } from './proxify'

/**
 * Mirrors all field values of the source to the target proxy, so that the
 * target becomes a copy of the source.
 */
export function mirror(
	field: string,
	source: any,
	target: any,
	getId = getIdFromObject,
) {
	const sourceType = getType(source)
	// Unproxify the target so that we do not track it accidentally.
	const targetRaw = unproxify(target)
	const targetType = getType(targetRaw)
	if (logLevel >= 2) {
		console.debug(`🔰 🪞 Mirror: %c${field}(${sourceType})`, HIGHLIGHT)
	}
	if (sourceType !== targetType) {
		throw new Error(
			`[swctkw] ${sourceType} cannot be mirrored to ${targetType}.`,
		)
	}
	if (sourceType === 'array') {
		const sourceIds = new Set<string | number>()
		const id__targetItem = new Map<string | number, any>()

		// Collect target items by ID
		for (let i = 0; i < targetRaw.length; i++) {
			const item = targetRaw[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id != null) {
					if (id__targetItem.has(id)) {
						throw new Error(
							`[t55msp] Duplicate target ID in ${field}: ${JSON.stringify(id)}`,
						)
					}
					id__targetItem.set(id, item)
				}
			}
		}

		// Collect source IDs
		for (let i = 0; i < source.length; i++) {
			const item = source[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id != null) {
					if (sourceIds.has(id)) {
						throw new Error(
							`[t55mtx] Duplicate source ID in ${field}: ${JSON.stringify(id)}`,
						)
					}
					sourceIds.add(id)
				}
			}
		}

		// Remove target object if it does not have a matching ID
		if (logLevel >= 3) {
			console.debug(`🔰 ➖ Removing object items with no ID match`)
		}
		for (let i = targetRaw.length - 1; i >= 0; i--) {
			const item = targetRaw[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !sourceIds.has(id)) {
					;(target as any[]).splice(i, 1)
				}
			}
		}
		if (logLevel >= 3) {
			console.debug(`🛑 ➖ Removing object items with no ID match`)
		}

		// Add or mirror items
		if (logLevel >= 3) {
			console.debug(`🔰 ➕ Adding items`)
		}
		for (let i = 0; i < source.length; i++) {
			const item = source[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !id__targetItem.has(id)) {
					if (logLevel >= 3) {
						console.debug(`🔰 ➕ Add new item: ${i}`)
					}
					;(target as any[]).splice(i, 0, item)
					if (logLevel >= 3) {
						console.debug(`🛑 ➕ Add new item: ${i}`)
					}
				} else {
					const targetItem = id__targetItem.get(id)
					const targetItemMaybe = targetRaw[i]
					if (targetItem !== targetItemMaybe) {
						const oldIndex = targetRaw.indexOf(targetItem, i + 1)
						if (logLevel >= 3) {
							console.debug(
								`🔰 ✔️ Insert existing item earlier: ${i} ← ${oldIndex}`,
							)
						}
						;(target as any[]).splice(oldIndex, 1)
						;(target as any[]).splice(i, 0, targetItem)
						if (logLevel >= 3) {
							console.debug(
								`🛑 ✔️ Insert existing item earlier: ${i} ← ${oldIndex}`,
							)
						}
					}
					mirror(`${field}[${i}]`, item, (target as any[])[i], getId)
				}
			} else {
				if (!Object.is(item, (target as any[])[i])) {
					if (logLevel >= 3) {
						console.debug(`🔰 🟰 Set item: ${i}`)
					}
					;(target as any[]).splice(i, 0, item)
					if (logLevel >= 3) {
						console.debug(`🛑 🟰 Set item: ${i}`)
					}
				}
			}
		}
		if (logLevel >= 3) {
			console.debug(`🛑 ➕ Adding items`)
		}

		// Crop the target array
		if (targetRaw.length > source.length) {
			if (logLevel >= 3) {
				console.debug(`🔰 🪓 Cropping array`)
			}
			// ;(target as any[]).splice(s.length, t.length - s.length)
			;(target as any[]).length = source.length
			if (logLevel >= 3) {
				console.debug(`🛑 🪓 Cropping array`)
			}
		}
	} else if (sourceType === 'object') {
		const t = targetRaw
		const sourceKeys = new Set<string>()

		// Copy source values to target
		for (const [key, sourceValue] of Object.entries(source)) {
			sourceKeys.add(key)
			const targetValue = (t as any)[key]
			if (!Object.is(sourceValue, targetValue)) {
				if (
					(Array.isArray(sourceValue) && Array.isArray(targetValue)) ||
					(isObject(sourceValue) && isObject(targetValue))
				) {
					mirror(`${field}.${key}`, sourceValue, target[key], getId)
				} else {
					target[key] = sourceValue
				}
			}
		}

		// Delete superfluous target values
		for (const key of Object.keys(t)) {
			if (!sourceKeys.has(key)) {
				delete target[key]
			}
		}
	}

	if (logLevel >= 2) {
		console.debug(`🛑 🪞 Mirror: %c${field}(${sourceType})`, HIGHLIGHT)
	}
}

function isObject(o: unknown) {
	return getType(o) === 'object'
}

function getType(o: unknown) {
	return Array.isArray(o) ? 'array' : o === null ? 'null' : typeof o
}

function getIdFromObject(o: { id?: unknown }): string | number | undefined {
	const id = o.id
	switch (typeof id) {
		case 'string':
		case 'number':
			return id
	}
	return undefined
}
