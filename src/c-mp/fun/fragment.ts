import { Fragment } from '../comp/Fragment'
import { TChild } from '../model/TChildren'
import { h } from './h'

export function fragment(...children: TChild[]) {
	return h(Fragment, { children })
}
