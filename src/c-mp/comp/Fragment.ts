import { defineComponent } from '../fun/defineComponent'
import { TChildren, TChildrenIn } from '../model/TChildren'

/**
 * Shows children.
 */
export const Fragment = defineComponent<{
	children: TChildrenIn
}>('Fragment', (props, $) => {
	$.append(...(props.children as TChildren))
	return $
})
