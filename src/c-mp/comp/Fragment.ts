import { defineComponent } from '../fun/useComponent'
import { TChildren } from '../model/TChildren'

/**
 * Shows children.
 */
export const Fragment = defineComponent<{
	children: TChildren
}>('Fragment', (props, $) => {
	$.append(...props.children)
	return $
})
