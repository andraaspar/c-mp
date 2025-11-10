import { useEffect } from './useEffect'
import { maybeReloadLoadablesOnVisible } from './useLoadable'

export function useReloadOnVisible() {
	useEffect('reloadOnVisibleEffect', () => {
		function onVisibilityChange() {
			if (document.visibilityState === 'visible') {
				const count = maybeReloadLoadablesOnVisible()
				if (count) {
					console.debug(
						`[t57jfc] Document visible, reloading ${count} entries...`,
					)
				}
			}
		}
		window.addEventListener('visibilitychange', onVisibilityChange)
		return () => {
			window.removeEventListener('visibilitychange', onVisibilityChange)
		}
	})
}
