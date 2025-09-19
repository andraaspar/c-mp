const LINE_ENDING_RE = /[\r\n]+/
const STRIP_RE = /@.*\/c-mp\//

export function stripStack(e: unknown) {
	if (e instanceof Error && e.stack) {
		e.stack = e.stack
			.split(LINE_ENDING_RE)
			.filter((line) => !line.match(STRIP_RE))
			.join("\n")
	}
}
