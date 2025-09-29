import { childToBasicItem } from '../fun/childToBasicItem'
import { defineComponent } from '../fun/useComponent'
import { useEffect } from '../fun/useEffect'
import { TSlotValue } from '../model/TChildrenIn'

/**
 * Displays JSX or a string. If the string is trusted, shows it unescaped.
 */
export const Slot = defineComponent<{
	/**
	 * Get the value to display.
	 */
	get: (() => TSlotValue) | undefined

	/**
	 * Whether the value from the get function is a trusted HTML and can be
	 * rendered without escaping.
	 */
	isTrustedHtml?: boolean
}>('Slot', (props, $) => {
	useEffect($.debugName, () => {
		// Get the new value.
		let value = props.get?.()

		// Remove the old content.
		$.innerHTML = ''

		if (value) {
			if (props.isTrustedHtml && typeof value === 'string') {
				// Display the new content unescaped.
				$.innerHTML = value
			} else if (Array.isArray(value)) {
				// Display the new content array normally.
				$.append(...value.map(childToBasicItem))
			} else {
				// Display the new single content normally.
				$.append(childToBasicItem(value))
			}
		}
	})

	return $
})
