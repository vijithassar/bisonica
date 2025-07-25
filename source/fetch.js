/**
 * retrieve data from remote servers
 * @module fetch
 * @see {@link module:data}
 * @see {@link https://vega.github.io/vega-lite/docs/data.html|vega-lite:data}
 */

import * as d3 from 'd3'

const cache = new WeakMap()

/**
 * retrieve data from the cache
 * @param {object} data data definition
 * @return {object[]} data set
 */
const cached = data => {
	if (data.url) {
		return cache.get(data)
	}
}

/**
 * fetch remote data
 * @param {object} data data definition
 * @return {Promise<object[]>} data set
 */
const fetch = data => {
	const extensions = ['json', 'tsv', 'csv', 'dsv']
	const extension = data?.format?.type ||
		extensions.find(item => data.url.endsWith(`.${item}`)) ||
		'json'
	if (extension === 'dsv') {
		return d3.dsv(data.format.delimiter, data.url)
	} else {
		return d3[extension](data.url)
	}
}

/**
 * fetch and cache all remote resources for a specification
 * @param {specification} s Vega Lite specification
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
