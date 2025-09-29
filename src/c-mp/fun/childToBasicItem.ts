import { Slot } from '../comp/Slot'
import { TChildrenInBasicItem, TSlotGetter } from '../model/TChildrenIn'
import { useComponent } from './useComponent'

export function childToBasicItem(
	child: TChildrenInBasicItem | TSlotGetter,
): TChildrenInBasicItem {
	return typeof child === 'function'
		? useComponent(Slot, { get: child })
		: child
}
