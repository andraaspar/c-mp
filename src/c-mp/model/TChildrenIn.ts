export type TChildrenInBasicItem = JSX.Element | string
export type TChildrenInBasicArray = TChildrenInBasicItem[]
export type TChildrenInBasic = TChildrenInBasicItem | TChildrenInBasicArray

export type TSlotGetter = () => TSlotValue
export type TChildrenInItem = TChildrenInBasicItem | TSlotGetter
export type TChildrenInArray = TChildrenInItem[]

/**
 * This is the type of the children prop that can be passed to a component.
 */
export type TChildrenIn = TChildrenInBasicItem | TSlotGetter | TChildrenInArray

/**
 * The types of values a Slot can display.
 */
export type TSlotValue = TChildrenIn | null | undefined
