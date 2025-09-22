import { defineComponent } from '../fun/useComponent'
import { useEffect } from '../fun/useEffect'
import { TChildrenIn } from '../model/TChildrenIn'

/**
 * The types of values a Slot can display.
 */
export type TSlotValue = TChildrenIn | null | undefined

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
				$.append(...value)
			} else {
				// Display the new single content normally.
				$.append(value)
			}
		}
	})

	return $
})
