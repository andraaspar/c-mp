import { HIGHLIGHT } from '../model/HIGHLIGHT'
import { IProps } from '../model/IProps'
import { h } from './h'
import { log2Group, log2GroupEnd } from './log'

/**
 * The debug name of each init function.
 */
const debugNameByInit = new Map<IComponentInit<any>, string>()

/**
 * Declares the shape of an init function to be passed to a c-mp web component.
 * Returning a JSX.Element is a requirement for JSX support. The returned value
 * itself is not used in any way.
 */
export interface IComponentInit<P extends IProps = IProps> {
	(props: P, $: Comp<P>): JSX.Element
}

/**
 * The list of c-mp web components currently executing their init function.
 */
export const activeComps: Comp<any>[] = []

/**
 * The c-mp web component.
 */
export class Comp<P extends IProps> extends HTMLElement {
	/**
	 * The props passed to this instance at init time. This field is set directly
	 * on the instance after it is constructed.
	 */
	props: P | undefined

	/**
	 * The init function used to set up this component. This field is set directly
	 * on the instance after it is constructed.
	 */
	init: IComponentInit<P> | undefined

	/**
	 * The name of this component as used in debug messages.
	 */
	debugName = 'c-mp'

	/**
	 * The parent c-mp instance this belongs to.
	 */
	parentComp: Comp<any> | null | undefined

	/**
	 * Callbacks to call when this c-mp instance is disconnected.
	 */
	kills: (() => void)[] = []

	/**
	 * An optional error handler callback to be supplied by the init function.
	 */
	onError: ((e: unknown) => void) | undefined

	/**
	 * Whether this c-mp web component has already been connected.
	 */
	wasConnected = false

	/**
	 * Executes each time this c-mp web component is connected to the DOM.
	 */
	connectedCallback() {
		this.debugName =
			((this.init && debugNameByInit.get(this.init)) ?? 'c-mp') +
			(this.props?.debugName ? `(${this.props.debugName})` : '')

		if (this.wasConnected) {
			throw new Error(
				`[swczjp] Component ${this.debugName} was already connected.`,
			)
		}

		// It makes no sense, but this can sometimes happen.
		if (!this.isConnected) {
			throw new Error(
				`[t2twu3] Component ${this.debugName} was not connected after all.`,
			)
		}
		this.wasConnected = true

		// The component enters the DOM. It initializes a context and calls the
		// component function inside.

		this.parentComp =
			activeComps.at(-1) ?? this.parentElement?.closest<Comp<any>>('c-mp')

		log2Group(
			`☀️ Component connected: %c${this.debugName}`,
			HIGHLIGHT,
			this,
			'inside',
			this.parentComp ?? this.parentNode,
		)

		this.setAttribute('is', this.debugName)

		activeComps.push(this)

		try {
			this.init?.(this.props!, this)
		} catch (e) {
			this.handleError(e)
		} finally {
			activeComps.pop()
			log2GroupEnd()
		}
	}

	/**
	 * Invoked when trying to handle an error in the init function or an effect.
	 */
	handleError(e: unknown) {
		let handled = false
		if (this.onError) {
			try {
				log2Group(`🎯 Handling error: %c${name}`, HIGHLIGHT)
				this.onError(e)
				handled = true
			} catch (e) {
				console.error(e)
			} finally {
				log2GroupEnd()
			}
		}
		if (!handled) {
			if (this.parentComp) {
				log2Group(`🔍 Looking for error handler: %c${name}`, HIGHLIGHT)
				this.parentComp.handleError(e)
				log2GroupEnd()
			} else {
				log2Group(`⚠️ Failed to handle error: %c${name}`, HIGHLIGHT)
				console.error(e)
				this.remove()
				log2GroupEnd()
			}
		}
	}

	/**
	 * Invoked when this c-mp web component is disconnected from the DOM.
	 */
	disconnectedCallback() {
		// This matters because of disconnected components going through the lifecycle.
		if (!this.wasConnected) return

		// The component is removed from the DOM, or is being moved around. It kills
		// the context.
		log2Group(
			`🌑 Component disconnected: %c${this.debugName}`,
			HIGHLIGHT,
			this,
			'from',
			this.parentComp ?? this.parentNode,
		)

		this.parentComp = undefined

		// Execute kill callbacks. This ends effects.
		while (this.kills.length) {
			this.kills.shift()?.()
		}

		// Remove all children.
		this.innerHTML = ''

		this.wasConnected = false
		log2GroupEnd()
	}
}

// Let Comp be the custom element for <c-mp>.
customElements.define('c-mp', Comp)

/**
 * Create an instance of the c-mp component using the provided init function and
 * props.
 */
export function useComponent<P extends IProps>(
	init: IComponentInit<P>,
	props: P,
) {
	return h('c-mp', { props, init }) as Comp<P>
}

/**
 * Define a new init function that can be used in a useComponent call. This
 * makes sure that each init function has a corresponding debug name, and it
 * also makes declaring the props easier.
 */
// This one is for basic needs. No separate interface required for declaring
// props.
export function defineComponent<
	P,
	I extends IComponentInit<P & IProps> = IComponentInit<P & IProps>,
>(debugName: string, init: I): I
// This one is for templated functions. Use it with a separate interface that
// extends IProps.
export function defineComponent<T extends IComponentInit<any>>(
	debugName: string,
	init: T,
): T
export function defineComponent<T extends IComponentInit<any>>(
	debugName: string,
	init: T,
): T {
	debugNameByInit.set(init, debugName)
	return init
}
