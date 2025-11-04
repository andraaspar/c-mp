export function getGlobalCmp(): any {
	let it = (globalThis as any).cmp
	if (!it) it = (globalThis as any).cmp = {}
	return it
}
