import { IExtraAttributes } from './IExtraAttributes'
import { TFns } from './TFns'

export type TAttributes<T> = IExtraAttributes<T> &
	Partial<TFns<Omit<T, 'children' | 'className' | 'style' | 'classList'>>>
