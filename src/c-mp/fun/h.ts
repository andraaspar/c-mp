import { IExtraAttributes } from '../model/IExtraAttributes'
import { IProps } from '../model/IProps'
import { TAttributes } from '../model/TAttributes'
import { TChildren } from '../model/TChildren'
import { Comp, IComponentInit, ICompProps } from './defineComponent'
import { expandSlots } from './expandSlots'
import { useEffect } from './useEffect'

export function h<C extends IComponentInit<any>, P extends Parameters<C>[0]>(
	name: C,
	attrs: P,
): Comp<P>
export function h<
	N extends keyof HTMLElementTagNameMap,
	E extends HTMLElementTagNameMap[N],
>(name: N, attrs: TAttributes<E>): E
export function h(name: string, attrs: TAttributes<HTMLElement>): HTMLElement
export function h(
	name: string | Function,
	attrs: IProps & IExtraAttributes<HTMLElement>,
	// maybeKey?: unknown,
	// isStaticChildren?: boolean,
	// source?: ISource,
	// self?: unknown,
): HTMLElement {
	// Standardize the shape of children: JSX can pass single elements. This
	// transformation makes it easier to deal with children in components.
	if (attrs.children != null) {
		if (Array.isArray(attrs.children)) {
			attrs.children = attrs.children.map(expandSlots)
		} else {
			attrs.children = [expandSlots(attrs.children)]
		}
	}

	let elem: HTMLElement
	if (typeof name === 'function') {
		// This is a component.
		elem = h('c-mp', {
			init: name as IComponentInit<any>,
			props: attrs,
		} satisfies ICompProps)
	} else {
		// This is an element.
		elem = document.createElement(name)

		for (const [k, v] of Object.entries(attrs)) {
			if (k === 'class') {
				if (typeof v === 'function') {
					// class set to a function: set up an effect with the return value.
					useEffect(`${name} → ${k}`, () => {
						const it = v()
						if (Array.isArray(it)) elem.className = it.filter(Boolean).join(' ')
						else if (typeof it === 'string') elem.className = it
						else elem.className = ''
					})
				} else if (Array.isArray(v)) {
					// class set to an array: join into a string, filtering out falsy
					// values.
					elem.className = v.filter(Boolean).join(' ')
				} else {
					elem.className = v as string
				}
			} else if (k === 'style') {
				if (typeof v === 'function') {
					// style set to a function: set up an effect with the return value.
					useEffect(`${name} → ${k}`, () => {
						const it = v()
						if (it && typeof it === 'object') {
							Object.assign(elem.style, it)
						}
					})
				} else if (v && typeof v === 'object') {
					Object.assign(elem.style, v)
				}
			} else if (
				k !== 'children' &&
				k !== 'ref' &&
				typeof v === 'function' &&
				!k.startsWith('on') &&
				!name.includes('-')
			) {
				// Any other properties set to a function: set up an effect to modify
				// the value. Web components are excluded from this functionality to
				// make it possible to pass functions to them (see the init function of
				// c-mp).
				useEffect(`${name} → ${k}`, () => {
					;(elem as any)[k] = v()
				})
			} else if (k !== 'children') {
				// Any other properties (except for children) set to any value.
				;(elem as any)[k] = v
			}
		}
		// Handle children.
		if (attrs.children) {
			elem.append(...(attrs.children as TChildren))
		}
	}
	// Pass the completed element to the ref function, if provided.
	if (attrs.ref) {
		try {
			attrs.ref(elem)
		} catch (e) {
			console.error(e)
		}
	}

	return elem
}
