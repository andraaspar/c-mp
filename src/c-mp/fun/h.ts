import { IExtraAttributes } from '../model/IExtraAttributes'
import { IProps } from '../model/IProps'
import { TAttributes } from '../model/TAttributes'
import { activeComps, Comp, IComponentInit } from './defineComponent'
import { expandSlots } from './expandSlots'
import { logIndent } from './log'
import { useEffect } from './useEffect'

export function h<C extends IComponentInit<any>, P extends Parameters<C>[0]>(
	name: C,
	attrs: P,
): Comp<P>
export function h<
	N extends keyof HTMLElementTagNameMap,
	E extends HTMLElementTagNameMap[N],
>(name: N, attrs: TAttributes<E>): E
export function h(name: string, attrs: TAttributes<HTMLElement>): Element
export function h(
	name: string | Function,
	attrs: IProps & IExtraAttributes<HTMLElement>,
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
		const elem = document.createElement('c-mp') as Comp<any>
		elem.init = name as IComponentInit<any>
		elem.props = attrs
		return elem
	} else {
		// This is an element.
		const elem = document.createElement(name)

		let ref: ((it: typeof elem) => void) | undefined

		for (const [k, v] of Object.entries(attrs)) {
			if (k === 'class' && typeof v === 'function') {
				// class set to a function: set up an effect with the return value.
				useEffect(`${activeComps.at(-1)?.debugName}→${name}→${k}`, () => {
					const it = v(elem)
					if (Array.isArray(it)) elem.className = it.filter(Boolean).join(' ')
					else if (typeof it === 'string') elem.className = it
					else elem.className = ''
				})
			} else if (k === 'class' && Array.isArray(v)) {
				// class set to an array: join into a string, filtering out falsy
				// values.
				elem.className = v.filter(Boolean).join(' ')
			} else if (k === 'ref' && typeof v === 'function') {
				// Save ref for when the element is ready.
				ref = v as (it: typeof elem) => void
			} else if (
				k !== 'children' &&
				typeof v === 'function' &&
				!k.startsWith('on') &&
				!name.includes('-')
			) {
				// Any other properties set to a function: set up an effect to modify
				// the value. Web components are excluded from this functionality to
				// make it possible to pass functions to them (see the init function of
				// c-mp).
				useEffect(`${activeComps.at(-1)?.debugName}→${name}→${k}`, () => {
					;(elem as any)[k] = v()
				})
			} else if (k !== 'children') {
				// Any other properties (except for children) set to any value.
				;(elem as any)[k] = v
			}
		}
		// Handle children.
		if (Array.isArray(attrs.children)) {
			elem.append(...attrs.children.map(expandSlots))
		} else if (attrs.children) {
			elem.append(expandSlots(attrs.children))
		}
		// Pass the completed element to the ref function, if provided.
		if (ref) {
			try {
				ref(elem)
			} catch (e) {
				console.error(logIndent, e)
			}
		}

		return elem
	}
}
