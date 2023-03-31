import * as d3 from 'd3'

const cache = new WeakMap()

/**
 * retrieve data from the cache
 * @param {object} data data definition
 * @returns {array} data set
 */
const cached = data => {
	if (data.url) {
		return cache.get(data)
	}
}

/**
 * fetch remote data
 * @param {object} s Vega Lite specification
 * @returns {Promise<object[]>} data set
 */
const fetch = async s => await d3[s.data.format?.type || 'json'](s.data.url)

export { cached }
