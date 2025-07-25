/**
 * reusable nodes that are referenced but aren't directly rendered
 * @module defs
 */

import { feature } from './feature.js'
import { gradient } from './gradient.js'
import { noop } from './helpers.js'
import { memoize } from './memoize.js'

/**
 * create a defs node
 * @param {specification} s Vega Lite specification
 * @return {function(object)} defs rendering function
 */
const _defs = s => {
	if (!feature(s).hasDefs()) {
		return noop
	}
	const renderer = selection => {
		if (selection.node().tagName !== 'svg') {
			throw new Error('defs must be rendered at the top level of the SVG node')
		}
		const defs = selection.append('defs')
		const fns = [gradient(s)]
		fns.forEach(fn => {
			defs.call(fn)
		})
	}
	return renderer
}
const defs = memoize(_defs)

export { defs }
