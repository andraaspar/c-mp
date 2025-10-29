import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { log1Group, log1GroupEnd } from './log'
import { unproxify } from './proxify'

/**
 * Mirrors all field values of the source to the target proxy, so that the
 * target becomes a copy of the source.
 */
export function mirror(
	field: string | number,
	source: any,
	target: any,
	getId = getIdFromObject,
) {
	const sourceType = getType(source)
	// Unproxify the target so that we do not track it accidentally.
	const targetRaw = unproxify(target)
	const targetType = getType(targetRaw)
	log1Group(`🪞 Mirror: %c${field}(${sourceType})`, HIGHLIGHT)
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
					sourceIds.add(id)
				}
			}
		}

		// Remove target object if it does not have a matching ID
		log1Group(`➖ Removing object items with no ID match`)
		for (let i = 0; i < targetRaw.length; i++) {
			const item = targetRaw[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !sourceIds.has(id)) {
					;(target as any[]).splice(i, 1)
					i--
				}
			}
		}
		log1GroupEnd()

		// Add or mirror items
		log1Group(`➕ Adding items`)
		for (let i = 0; i < source.length; i++) {
			const item = source[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !id__targetItem.has(id)) {
					log1Group(`➕ Add new item: ${i}`)
					;(target as any[]).splice(i, 0, item)
					log1GroupEnd()
				} else {
					const targetItem = id__targetItem.get(id)
					const targetItemMaybe = targetRaw[i]
					if (targetItem !== targetItemMaybe) {
						const oldIndex = targetRaw.indexOf(targetItem, i + 1)
						log1Group(`✔️ Insert existing item earlier: ${i} ← ${oldIndex}`)
						;(target as any[]).splice(oldIndex, 1)
						;(target as any[]).splice(i, 0, targetItem)
						log1GroupEnd()
					}
					mirror(i, item, (target as any[])[i], getId)
				}
			} else {
				if (!Object.is(item, (target as any[])[i])) {
					log1Group(`🟰 Set item: ${i}`)
					;(target as any[]).splice(i, 0, item)
					log1GroupEnd()
				}
			}
		}
		log1GroupEnd()

		// Crop the target array
		if (targetRaw.length > source.length) {
			log1Group(`🪓 Cropping array`)
			// ;(target as any[]).splice(s.length, t.length - s.length)
			;(target as any[]).length = source.length
			log1GroupEnd()
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
					mirror(key, sourceValue, target[key], getId)
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

	log1GroupEnd()
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
