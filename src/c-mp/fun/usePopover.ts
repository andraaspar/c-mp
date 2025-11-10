import { activeComps } from './defineComponent'
import { makeAdjustLayoutDropdown } from './makeAdjustLayoutDropdown'
import { untrack, useEffect } from './useEffect'
import { mutateState, useState } from './useState'

export function usePopover({
	getMenuElem,
	getButtonElem,
}: {
	getMenuElem: () => HTMLElement | null | undefined
	getButtonElem: () => HTMLButtonElement | null | undefined
}) {
	const debugName = `${activeComps.at(-1)?.debugName}→popover`
	const popoverState = useState(`${debugName}→state`, { isOpen: false })
	let justToggled = false
	useEffect(`${debugName}→adjust`, () => {
		const menuElem = getMenuElem()
		const buttonElem = getButtonElem()
		// if (menuElem && buttonElem) {
		// 	buttonElem.popoverTargetElement = menuElem
		// }
		if (popoverState.isOpen && menuElem && buttonElem) {
			return untrack(debugName, () => {
				const adjust = makeAdjustLayoutDropdown()
				let aborted = false
				function run() {
					if (aborted) return
					adjust(menuElem!, buttonElem!)
					requestAnimationFrame(run)
				}
				run()
				return () => {
					aborted = true
				}
			})
		}
	})
	useEffect(`${debugName}→onbeforetoggle`, () => {
		const menuElem = getMenuElem()
		if (!menuElem) return
		menuElem.popover = 'auto'
		function onBeforeToggle(e: Event) {
			// console.debug(`[swx89a] usePopover.onBeforeToggle:`, (e as ToggleEvent).newState)
			mutateState('popover match event open state [t5im3s]', () => {
				popoverState.isOpen = (e as ToggleEvent).newState === 'open'
			})
			justToggled = true
			requestAnimationFrame(() => {
				justToggled = false
			})
		}
		menuElem.addEventListener('beforetoggle', onBeforeToggle)
		return () => {
			menuElem.removeEventListener('beforetoggle', onBeforeToggle)
		}
	})
	useEffect(`${debugName}→button→onclick`, () => {
		const buttonElem = getButtonElem()
		if (buttonElem) {
			buttonElem.addEventListener('click', toggle)
			return () => {
				buttonElem.removeEventListener('click', toggle)
			}
		}
	})
	function getIsOpen() {
		return popoverState.isOpen
	}
	function close() {
		if (!justToggled) getMenuElem()?.hidePopover()
	}
	function open() {
		if (!justToggled) getMenuElem()?.showPopover()
	}
	function toggle() {
		if (!justToggled) getMenuElem()?.togglePopover()
	}
	return {
		getIsOpen,
		close,
		open,
		toggle,
	}
}
