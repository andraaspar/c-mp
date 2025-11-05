import { Slot } from '../comp/Slot'
import { TChildrenInBasicItem, TSlotGetter } from '../model/TChildrenIn'
import { h } from './h'

export function expandSlots(
	child: TChildrenInBasicItem | TSlotGetter,
): TChildrenInBasicItem {
	return typeof child === 'function' ? h(Slot, { get: child }) : child
}
