import { IComponentInit } from '../c-mp/fun/defineComponent'
import { ClassTestComp } from '../comp/ClassTestComp'
import { ErrorBoundaryImmediateTestComp } from '../comp/ErrorBoundaryImmediateTestComp'
import { ErrorBoundaryInComponentEffectTestComp } from '../comp/ErrorBoundaryInComponentEffectTestComp'
import { ErrorBoundaryInComponentInfiniteEffectTestComp } from '../comp/ErrorBoundaryInComponentInfiniteEffectTestComp'
import { ErrorBoundaryInComponentInitTestComp } from '../comp/ErrorBoundaryInComponentInitTestComp'
import { ForTestComp } from '../comp/ForTestComp'
import { HyperscriptTestComp } from '../comp/HyperscriptTestComp'
import { ShowTestComp } from '../comp/ShowTestComp'
import { SlotTestComp } from '../comp/SlotTestComp'
import { UseLoadableDependentTestComp } from '../comp/UseLoadableDependentTestComp'
import { UseLoadableTestComp } from '../comp/UseLoadableTestComp'
import { UsePagedLoadableTestComp } from '../comp/UsePagedLoadableTestComp'

// prettier-ignore
const data = [
	['#class', ClassTestComp, 'Class'],
	['#slot', SlotTestComp, 'Slot'],
	['#for', ForTestComp, 'For'],
	['#show', ShowTestComp, 'Show'],
	['#hyperscript', HyperscriptTestComp, 'Hyperscript'],
	['#use-loadable', UseLoadableTestComp, 'UseLoadable'],
	['#use-loadable-dependent', UseLoadableDependentTestComp, 'UseLoadableDependent'],
	['#use-paged-loadable', UsePagedLoadableTestComp, 'UsePagedLoadable'],
	['#error-boundary-immediate', ErrorBoundaryImmediateTestComp, 'ErrorBoundaryImmediate'],
	['#error-boundary-in-component-init', ErrorBoundaryInComponentInitTestComp, 'ErrorBoundaryInComponentInit'],
	['#error-boundary-in-component-effect', ErrorBoundaryInComponentEffectTestComp, 'ErrorBoundaryInComponentEffect'],
	['#error-boundary-in-component-infinite-effect', ErrorBoundaryInComponentInfiniteEffectTestComp, 'ErrorBoundaryInComponentInfiniteEffect'],
] as const

export const pages = data.map(([, comp]) => comp)

export const hash__page = new Map<string, IComponentInit>(
	data.map(([hash, comp]) => [hash, comp]),
)

export const page__hash = new Map<IComponentInit, string>(
	data.map(([hash, comp]) => [comp, hash]),
)

export const page__title = new Map<IComponentInit, string>(
	data.map(([, comp, title]) => [comp, title]),
)
