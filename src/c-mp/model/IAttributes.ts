export interface IAttributes<T> {
	className?:
		| string[]
		| string
		| null
		| undefined
		| ((
				elem: T
		  ) =>
				| (string | null | undefined | boolean | number | bigint)[]
				| string
				| null
				| undefined)
	bindElement?: (elem: T) => void
	[k: string]: unknown
	children?: (JSX.Element | string) | (JSX.Element | string)[]
}
