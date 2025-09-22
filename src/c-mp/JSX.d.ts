declare module JSX {
	export interface IntrinsicAttributes {
		// debugName?: string
	}

	export type IntrinsicElements = {
		[P in keyof HTMLElementTagNameMap]: Partial<
			Omit<
				import('./model/TFns').TFns<HTMLElementTagNameMap[P]>,
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
