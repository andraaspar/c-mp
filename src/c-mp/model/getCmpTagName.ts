let index = 1n
let tagName = 'c-mp'

export function getCmpTagName() {
	return tagName
}

export function incrementCmpTagName() {
	index++
	tagName = `c-mp-${index}`
}
