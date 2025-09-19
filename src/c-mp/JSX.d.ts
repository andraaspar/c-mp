declare module JSX {
	export interface IntrinsicAttributes {
		// debugName?: string
	}

	type TFns<T> = {
		[P in keyof T]: T[P] extends Function ? T[P] : T[P] | (() => T[P])
	}

	export type IntrinsicElements = {
		[P in keyof HTMLElementTagNameMap]: Partial<
			Omit<
				TFns<HTMLElementTagNameMap[P]>,
				'children' | 'className' | 'classList'
			>
		> &
			import('./model/IAttributes').IAttributes<HTMLElementTagNameMap[P]>
	}
	export interface ElementChildrenAttribute {
		children: {}
	}

	export type Element = globalThis.Element
}
