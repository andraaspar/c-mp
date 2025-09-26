import { AbortError } from './useLoadable'

export function sleep(ms: number, abortSetter?: (abort: () => void) => void) {
	return new Promise<void>((resolve, reject) => {
		abortSetter?.(() => {
			clearTimeout(ref)
			reject(new AbortError())
		})
		const ref = setTimeout(resolve, ms)
	})
}
