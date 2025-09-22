import { IAttributes } from '../model/IAttributes'
import { IProps } from '../model/IProps'
import { TFns } from '../model/TFns'
import { activeComps, Comp, IComponentInit, useComponent } from './useComponent'
import { useEffect } from './useEffect'

export function h<C extends IComponentInit<any>, P extends Parameters<C>[0]>(
	name: C,
	attrs: P,
): Comp<P>
export function h<
	N extends keyof HTMLElementTagNameMap,
	E extends HTMLElementTagNameMap[N],
>(
	name: N,
	attrs: IAttributes<E> &
		Partial<TFns<Omit<E, 'children' | 'className' | 'classList'>>>,
): E
export function h(
	name: string,
	attrs: IAttributes<HTMLElement> &
		Partial<TFns<Omit<HTMLElement, 'children' | 'className' | 'classList'>>>,
): Element
export function h(
	name: string | Function,
	attrs: IProps & IAttributes<HTMLElement>,
	// maybeKey?: unknown,
	// isStaticChildren?: boolean,
	// source?: ISource,
	// self?: unknown,
): Element {
	if (typeof name === 'function') {
		// This is a component.
		if (attrs.children != null && !Array.isArray(attrs.children)) {
			// Standardize the shape of children: JSX can pass single elements. This
			// transformation makes it easier to deal with children in components.
			attrs.children = [attrs.children]
		}
		return useComponent(name as IComponentInit<typeof attrs>, attrs)
	} else {
		// This is an element.
		const elem = document.createElement(name)
		const activeComponent = activeComps.at(-1)

		let bindElement: ((it: typeof elem) => void) | undefined

		for (const [k, v] of Object.entries(attrs)) {
			if (k === 'className' && typeof v === 'function') {
				// className set to a function: set up an effect with the return value.
				useEffect(`${activeComponent?.debugName}.${name}.${k}`, () => {
					const it = v(elem)
					if (Array.isArray(it)) elem.className = it.filter(Boolean).join(' ')
					else if (typeof it === 'string') elem.className = it
					else elem.className = ''
				})
			} else if (k === 'className' && Array.isArray(v)) {
				// className set to an array: join into a string, filtering out falsy
				// values.
				elem.className = v.filter(Boolean).join(' ')
			} else if (k === 'bindElement' && typeof v === 'function') {
				// Save bindElement for when the element is ready.
				bindElement = v as (it: typeof elem) => void
			} else if (
				typeof v === 'function' &&
				!k.startsWith('on') &&
				!name.includes('-')
			) {
				// Any other properties set to a function: set up an effect to modify
				// the value. Web components are excluded from this functionality to
				// make it possible to pass functions to them (see the init function of
				// c-mp).
				useEffect(`${activeComponent?.debugName}.${name}.${k}`, () => {
					;(elem as any)[k] = v()
				})
			} else if (k !== 'children') {
				// Any other properties (except for children) set to any value.
				;(elem as any)[k] = v
			}
		}
		// Handle children.
		if (Array.isArray(attrs.children)) {
			elem.append(...attrs.children)
		} else if (attrs.children) {
			elem.append(attrs.children)
		}
		// Pass the completed element to the bindElement function, if provided.
		if (bindElement) {
			try {
				bindElement(elem)
			} catch (e) {
				console.error(e)
			}
		}

		return elem
	}
}
