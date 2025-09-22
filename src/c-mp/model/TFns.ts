export type TFns<T> = {
	[P in keyof T]: T[P] extends Function ? T[P] : T[P] | (() => T[P])
}
