import { Slot } from '../comp/Slot'
import { TChild, TSlotGetter } from '../model/TChildren'
import { h } from './h'

export function expandSlots(child: TChild | TSlotGetter): TChild {
	return typeof child === 'function' ? h(Slot, { get: child }) : child
}
