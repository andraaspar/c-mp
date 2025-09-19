export interface IForFrames {
	promise: Promise<void>
	abort: () => void
}

export function forFrames(count: number): IForFrames {
	let isAborted = false
	return {
		promise: new Promise((resolve) => {
			function next() {
				if (isAborted) return
				if (--count > 0) requestAnimationFrame(next)
				else resolve()
			}
			next()
		}),
		abort: () => {
			isAborted = true
		},
	}
}
