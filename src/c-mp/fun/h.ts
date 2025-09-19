import { IAttributes } from '../model/IAttributes'
import { IProps } from '../model/IProps'
import { activeComps, Comp, IComponentInit, useComponent } from './useComponent'
import { useEffect } from './useEffect'

export function h<P extends IProps, C extends IComponentInit<P>>(
	name: C,
	attrs: P,
): Comp<P>
export function h<
	N extends keyof HTMLElementTagNameMap,
	P extends Partial<HTMLElementTagNameMap[N]>,
>(
	name: N,
	attrs: IAttributes<HTMLElementTagNameMap[N]>,
): HTMLElementTagNameMap[N]
export function h(name: string, attrs: IAttributes<HTMLElement>): Element
export function h(
	name: string | Function,
	attrs: IProps & IAttributes<HTMLElement>,
	// maybeKey?: unknown,
	// isStaticChildren?: boolean,
	// source?: ISource,
	// self?: unknown,
): Element {
	if (attrs.children != null && !Array.isArray(attrs.children)) {
		// Standardize the shape of children: JSX can pass single elements.
		attrs.children = [attrs.children]
	}
	if (typeof name === 'function') {
		return useComponent(name as IComponentInit<typeof attrs>, attrs)
	} else {
		const elem = document.createElement(name)
		if (attrs) {
			const activeComponent = activeComps.at(-1)
			for (const [k, v] of Object.entries(attrs)) {
				if (k === 'className' && typeof v === 'function') {
					useEffect(`${activeComponent?.debugName}.${name}.${k}`, () => {
						const it = v(elem)
						if (Array.isArray(it)) elem.className = it.filter(Boolean).join(' ')
						else if (typeof it === 'string') elem.className = it
						else elem.className = ''
					})
				} else if (k === 'className' && Array.isArray(v)) {
					elem.className = v.filter(Boolean).join(' ')
				} else if (k === 'bindElement' && typeof v === 'function') {
					try {
						v(elem)
					} catch (e) {
						console.error(e)
					}
				} else if (
					typeof v === 'function' &&
					!k.startsWith('on') &&
					!name.includes('-')
				) {
					useEffect(`${activeComponent?.debugName}.${name}.${k}`, () => {
						;(elem as any)[k] = v()
					})
				} else if (k === 'children') {
				} else {
					;(elem as any)[k] = v
				}
			}
		}
		if (attrs.children) {
			elem.append(...attrs.children)
		}

		return elem
	}
}
