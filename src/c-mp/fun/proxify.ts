const unwrapped = Symbol('unwrapped')

export interface IProxifyCallbacks {
	has?: (name: string, target: any, prop: string | symbol) => void
	get?: (name: string, target: any, prop: string | symbol) => void
	set?: (
		name: string,
		target: any,
		prop: string | symbol,
		newValue: any,
	) => void
	delete?: (name: string, target: any, prop: string | symbol) => void
}

/**
 * Creates a proxy of the given object or array. Each `get` will return a proxy
 * of the accessed value, as long as it is an object or array.
 */
export function proxify<T>(name: string, o: T, cbs?: IProxifyCallbacks): T {
	if (!isProxifyable(o)) {
		throw new Error(`[svh9tl] Object or array required.`)
	}

	// Always wrap the source object or array, and never a proxy.
	o = unproxify(o)

	return new Proxy(o as any, {
		// 'foo' in proxy
		has(target, p) {
			if (p === unwrapped) return true

			cbs?.has?.(name, target, p)
			return Reflect.has(target, p)
		},

		// proxy.foo; pArray[0]
		get(target, p, receiver) {
			if (p === unwrapped) return target

			cbs?.get?.(name, target, p)
			const result = Reflect.get(target, p, receiver)
			if (isProxifyable(result)) {
				// Return proxy rather than value: allows deep reads to trigger callbacks.
				return proxify(name + '.' + p.toString(), result, cbs)
			} else {
				// Primitives and class instances need not register.
				return result
			}
		},

		// proxy.foo = 'bar'; pArray.push('bar')
		set(target, p, newValue, receiver) {
			let result = true
			let hadKey = p in target
			let oldValue = (target as any)[p]
			newValue = unproxify(newValue)

			if (!Object.is(oldValue, newValue)) {
				// Value changed.
				result = Reflect.set(target, p, newValue, receiver)
				cbs?.set?.(name, target, p, newValue)
			}
			if (!hadKey && Array.isArray(target)) {
				// Array length changed. It is a computed property, so the callback must
				// be called explicitly.
				cbs?.set?.(name, target, 'length', target.length)
			}
			return result
		},

		// delete proxy.foo; pArray.splice(0, 1)
		deleteProperty(target, p) {
			let result = true
			if (p in target) {
				// The property exists before deletion.
				result = Reflect.deleteProperty(target, p)
				cbs?.delete?.(name, target, p)
			}
			return result
		},
	})
}

/**
 * Checks whether the given object is suitable for the proxify function.
 */
export function isProxifyable(o: unknown): boolean {
	return (
		o != null &&
		typeof o === 'object' &&
		(Array.isArray(o) ||
			Object.getPrototypeOf(o) === Object.prototype ||
			Object.getPrototypeOf(o) === null)
	)
}

/**
 * Get the source object or array of the given proxy; or the value itself, if it
 * is not a proxy.
 */
export function unproxify<T>(o: T): T {
	if (o != null && typeof o === 'object' && unwrapped in o) {
		o = o[unwrapped] as T
	}
	return o
}
