export type TChild = JSX.Element | string
/**
 * This is the actual type of children received by components.
 */
export type TChildren = TChild[]

export type TSlotGetter = () => TSlotValue
export type TChildIn = TChild | TSlotGetter

/**
 * This is the type of the children prop that can be passed to a component.
 */
export type TChildrenIn = TChildIn[] | TChildIn

/**
 * The types of values a Slot can display.
 */
export type TSlotValue = TChildrenIn | null | undefined
