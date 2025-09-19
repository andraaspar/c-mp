import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { log2Group, log2GroupEnd } from './log'
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
	const sourceRaw = unproxify(source)
	const sourceType = getType(sourceRaw)
	const targetRaw = unproxify(target)
	const targetType = getType(targetRaw)
	log2Group(`🪞 Mirror: %c${field}(${sourceType})`, HIGHLIGHT)
	if (sourceType !== targetType) {
		throw new Error(
			`[swctkw] ${sourceType} cannot be mirrored to ${targetType}.`,
		)
	}
	if (sourceType === 'array') {
		const s = sourceRaw
		const t = targetRaw
		const sourceIds = new Set<string | number>()
		const id__targetItem = new Map<string | number, any>()

		// Collect target items by ID
		for (let i = 0; i < t.length; i++) {
			const item = t[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id != null) {
					id__targetItem.set(id, item)
				}
			}
		}

		// Collect source IDs
		for (let i = 0; i < s.length; i++) {
			const item = s[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id != null) {
					sourceIds.add(id)
				}
			}
		}

		// Remove target object if it does not have a matching ID
		log2Group(`➖ Removing object items with no ID match`)
		for (let i = 0; i < t.length; i++) {
			const item = t[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !sourceIds.has(id)) {
					;(target as any[]).splice(i, 1)
					i--
				}
			}
		}
		log2GroupEnd()

		// Add or mirror items
		log2Group(`➕ Adding items`)
		for (let i = 0; i < s.length; i++) {
			const item = s[i]
			if (isObject(item)) {
				const id = getId(item)
				if (id == null || !id__targetItem.has(id)) {
					log2Group(`➕ Add new item: ${i}`)
					;(target as any[]).splice(i, 0, item)
					log2GroupEnd()
				} else {
					const targetItem = id__targetItem.get(id)
					const targetItemMaybe = t[i]
					if (targetItem !== targetItemMaybe) {
						const oldIndex = t.indexOf(targetItem, i + 1)
						log2Group(`✔️ Insert existing item earlier: ${i} ← ${oldIndex}`)
						;(target as any[]).splice(oldIndex, 1)
						;(target as any[]).splice(i, 0, targetItem)
						log2GroupEnd()
					}
					mirror(i, item, (target as any[])[i], getId)
				}
			} else {
				if (!Object.is(item, (target as any[])[i])) {
					log2Group(`🟰 Set item: ${i}`)
					;(target as any[]).splice(i, 0, item)
					log2GroupEnd()
				}
			}
		}
		log2GroupEnd()

		// Crop the target array
		if (t.length > s.length) {
			log2Group(`🪓 Cropping array`)
			// ;(target as any[]).splice(s.length, t.length - s.length)
			;(target as any[]).length = s.length
			log2GroupEnd()
		}
	} else if (sourceType === 'object') {
		const s = sourceRaw
		const t = targetRaw
		const sourceKeys = new Set<string>()

		// Copy source values to target
		for (const [key, sourceValue] of Object.entries(s)) {
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

	log2GroupEnd()
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
