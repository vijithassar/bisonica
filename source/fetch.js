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
 * @param {object} data data definition
 * @returns {Promise<object[]>} data set
 */
const fetch = data => d3[data?.format?.type || 'json'](data.url)

/**
 * fetch and cache all remote resources for a specification
 * @param {object} s Vega Lite specification
 */
const fetchAll = s => {
	const resources = [
		s.data,
		...(s.layer ? s.layer.map(layer => layer.data) : [])
	]
		.filter(Boolean)
		.filter(resource => resource.url)
	const promises = resources.map(fetch)
	promises.forEach((promise, index) => {
		promise.then(result => {
			const resource = resources[index]
			cache.set(resource, result)
		})
	})
	if (promises.length) {
		const all = Promise.allSettled(promises)
		return all
	} else {
		const resolver = resolve => resolve(true)
		const promise = new Promise(resolver)
		return promise
	}
}

export { cached, fetchAll }