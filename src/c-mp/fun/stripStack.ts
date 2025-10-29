import { getGlobalCmp } from './getGlobalCmp'
import { getNoError } from './getNoError'

const LINE_ENDING_RE = /[\r\n]+/
const STRIP_RE = /@.*\/c-mp\//

let stripStackDisabled: boolean = getNoError<boolean>(false, () =>
	JSON.parse(sessionStorage['STRIP_STACK_DISABLED']),
)

const c_mp = getGlobalCmp()
c_mp.setStripStack = (flag: boolean) => {
	stripStackDisabled = !flag
	sessionStorage['STRIP_STACK_DISABLED'] = JSON.stringify(!flag)
}
c_mp.getStripStack = () => !stripStackDisabled

export function stripStack(e: unknown) {
	if (!stripStackDisabled && e instanceof Error && e.stack) {
		e.stack = e.stack
			.split(LINE_ENDING_RE)
			.filter((line) => !line.match(STRIP_RE))
			.join('\n')
	}
}
