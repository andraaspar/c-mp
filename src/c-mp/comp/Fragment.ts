import { defineComponent } from '../fun/defineComponent'
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
