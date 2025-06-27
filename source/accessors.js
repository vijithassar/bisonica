/**
 * generate functions which look up a field from an input object for a data point
 * @module accessors
 * @see {@link module:encodings}
 * @see {@link module:scales}
 */

import { layoutDirection } from './marks.js'
import { encodingChannelCovariateCartesian, encodingChannelQuantitativeCartesian, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'
import { mark } from './helpers.js'
import { memoize } from './memoize.js'
import { parseTime } from './time.js'

/**
 * generate accessor methods which can look up
 * data points for a particular chart type
 * @param {specification} s Vega Lite specification
 * @param {mark} [type] mark type
 * @return {object} accessor methods
 */
const _createAccessors = (s, type = null) => {
	const key = type || mark(s)

	const accessors = {}

	// create an accessor function with standard property lookup behavior
	const accessor = channel => d => encodingValue(s, channel)(d)

	// helper to quickly create standard accessors based solely on channel names
	const standard = (...channels) => {
		channels.forEach(channel => {
			// this needs to check encoding hash directly instead of using
			// the encodingField() helper in order to account for datum and
			// value encodings
			if (s.encoding?.[channel]) {
				accessors[channel] = accessor(channel)
			}
		})
	}

	if (key === 'series') {
		accessors.color = d => d.key
	}

	if (['bar', 'area'].includes(key)) {
		const start = d => d[0]
		const lane = d => d.data.key

		if (layoutDirection(s) === 'horizontal') {
			accessors.x = start
			if (feature(s).hasEncodingY()) {
				accessors.y = lane
			}
		} else if (layoutDirection(s) === 'vertical') {
			accessors.y = start
			if (feature(s).hasEncodingX()) {
				accessors.x = lane
			}
		}

		accessors.start = d => (d[1] ? d : [d[0], d[0]])

		accessors.length = d => {
			return isNaN(d[1]) ? 0 : d[1] - d[0]
		}
	}

	if (key === 'arc') {
		accessors.theta = d => d.data.value
		accessors.color = d => d.data.key
		if (feature(s).hasRadius()) {
			accessors.radius = d => {
				return encodingValue(s, 'radius')(d.data)
			}
		}
	}

	if (key === 'rule') {
		standard('x', 'y', 'color')
	}

	if (['point', 'square', 'circle'].includes(key)) {
		standard('x', 'y', 'color', 'size')
	}

	if (key === 'line') {
		const quantitative = encodingChannelQuantitativeCartesian(s)
		const covariate = encodingChannelCovariateCartesian(s)

		accessors[quantitative] = d => d.value
		accessors[covariate] = feature(s).isTemporal() ? d => parseTime(d.period) : accessor(covariate)
		accessors.color = d => (feature(s).hasColor() ? encodingValue(s, 'color')(d) : null)
	}

	if (key === 'text') {
		standard('x', 'y', 'color', 'text', 'size')
	}

	if (key === 'image') {
		standard('x', 'y', 'url')
	}

	if (!s.encoding) {
		return accessors
	}

	Object.entries(s.encoding).forEach(([channel, encoding]) => {
		if (encoding === null) {
			return
		}
		if (encoding.datum) {
			accessors[channel] = () => encoding.datum
		}
	})

	Object.keys(s.encoding).forEach(channel => {
		if (encodingType(s, channel) === 'temporal') {
			const originalAccessor = accessors[channel]

			accessors[channel] = d => parseTime(originalAccessor(d))
		}
	})

	return accessors
}
const createAccessors = memoize(_createAccessors)

export { createAccessors }
