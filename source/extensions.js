/**
 * organize extended metadata stored under the usermeta property
 * @module extensions
 * @see {@link https://vega.github.io/vega-lite/docs/spec.html|vega-lite:spec}
 */

import './types.d.js'

/**
 * retrieve information from usermeta
 * @param {specification} s Vega Lite specification
 * @param {extension} key usermeta key
 */
const extension = (s, key) => {
	if (s.usermeta?.[key] !== undefined) {
		return s.usermeta[key]
	}
}

/**
 * initialize usermeta object if it doesn't
 * already exist
 * @param {specification} s Vega Lite specification
 */
const usermeta = s => {
	if (typeof s.usermeta !== 'object') {
		s.usermeta = {}
	}
}

export { extension, usermeta }
