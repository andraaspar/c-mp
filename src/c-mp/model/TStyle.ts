export type TStyle =
	| Partial<CSSStyleDeclaration>
	| (() => Partial<CSSStyleDeclaration>)
