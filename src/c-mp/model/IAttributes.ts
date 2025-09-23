import { TChildrenIn } from './TChildrenIn'

/**
 * These attributes are in addition to / replacing native fields on HTML
 * elements.
 */
export interface IAttributes<T> {
	/**
	 * Classes can be added in multiple ways to elements.
	 */
	className?:
		| string[]
		| string
		| null
		| undefined
		| ((
				elem: T,
		  ) =>
				| (string | null | undefined | boolean | number | bigint)[]
				| string
				| null
				| undefined)

	/**
	 * This function, if provided, will get a reference to the element.
	 */
	bindElement?: (elem: T) => void

	/**
	 * This declaration is here for "c-mp" and other unknown tags.
	 */
	[k: string]: unknown

	/**
	 * The children of the element.
	 */
	children?: TChildrenIn
}
