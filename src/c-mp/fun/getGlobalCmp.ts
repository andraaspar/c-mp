export function getGlobalCmp(): any {
	let it = (globalThis as any).c_mp
	if (!it) it = (globalThis as any).c_mp = {}
	return it
}
