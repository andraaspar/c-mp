import { defineComponent } from '../fun/useComponent'

export const Fragment = defineComponent<{
	children: (JSX.Element | string)[]
}>('Fragment', (props, $) => {
	$.append(...props.children)
	return $
})
