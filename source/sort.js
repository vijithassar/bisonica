/**
 * sort data before rendering
 * @module sort
 * @see {@link module:marks}
 * @see {@link https://vega.github.io/vega-lite/docs/sort.html|vega-lite:sort}
 */

import { ascending, descending, min, sum } from 'd3'
import { createAccessors } from './accessors.js'
import { encodingField, encodingValue } from './encodings.js'
import { feature } from './feature.js'
import { isContinuous, isDiscrete } from './helpers.js'
import { memoize } from './memoize.js'
import { values } from './values.js'

const orders = ['ascending', 'descending']

/**
 * determine whether a sort field is inverted
 * @param {string} sort field
 * @returns {boolean}
 */
const isInverted = sort => {
	return sort[0] === '-'
}

/**
 * look up sorting field
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string} encoding parameter
 */
const _sortField = (s, channel) => {
	const sort = s.encoding[channel]?.sort

	if (!sort) {
		return
	}

	if (typeof sort === 'string') {
		if (orders.includes(sort)) {
			return encodingField(s, channel)
		} else {
			const start = isInverted(sort) ? 1 : 0

			return encodingField(s, sort.slice(start))
		}
	} else if (typeof sort === 'object') {
		if (sort.field) {
			return sort.field
		} else if (sort.encoding) {
			return encodingField(s, sort.encoding)
		}
	}
}
const sortField = memoize(_sortField)

/**
 * look up sorting direction
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string|null} sorting direction
 */
const _sortOrder = (s, channel) => {
	const sort = s.encoding[channel]?.sort

	if (!sort) {
		return null
	}

	if (sort) {
		if (typeof sort === 'object' && orders.includes(sort.order)) {
			return sort.order
		} else if (typeof sort === 'string') {
			if (orders.includes(sort)) {
				return sort
			} else if (isInverted(sort)) {
				return 'descending'
			}
		}

		return 'ascending'
	}
}
const sortOrder = memoize(_sortOrder)

/**
 * look up the channel used for sorting
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {string} visual encoding channel used for sorting
 */
const _sortChannel = (s, channel) => {
	return Object.entries(s.encoding).find(item => item[1].field === sortField(s, channel))[0]
}
const sortChannel = memoize(_sortChannel)

/**
 * determine whether sort is ascending
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean} sorting direction is ascending
 */
const isAscending = (s, channel) => {
	return sortOrder(s, channel) === 'ascending'
}

/**
 * determine whether sort is descending
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {boolean} sorting direction is descending
 */
const isDescending = (s, channel) => {
	return sortOrder(s, channel) === 'descending'
}

/**
 * extract the values to sort and resolve repeated values
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {object[]} array of data values to be sorted
 */
const valuesToSort = (s, channel) => {
	const getValue = encodingValue(s, channel)
	const comparison = new Set(values(s).map(getValue))
	const unique = values(s).length === comparison.size

	// early return if there are no duplicate values to resolve
	if (unique) {
		return values(s)
	} else {
		// track the values to be used for domains
		const map = {}

		values(s).forEach(d => {
			const key = getValue(d)
			const value = encodingValue(s, sortChannel(s, channel))(d)
			const exists = Object.prototype.hasOwnProperty.call(map, key)

			if (!exists) {
				map[key] = value
			} else {
				const values = [value, map[key]]
				if (feature(s).isBar()) {
					map[key] = sum(values)
				} else {
					map[key] = min(values)
				}
			}
		})

		// sort the contents of the map
		const order = Object.entries(map)
			.sort(([, a], [, b]) => {
				return ascending(a, b)
			})
			.map(([key]) => key)

		const sort = (a, b) => {
			return order.indexOf(getValue(a)) - order.indexOf(getValue(b))
		}

		// replace raw values with values from the map
		const result = values(s).map(item => {
			const key = getValue(item)

			return { ...item, [encodingField(s, sortChannel(s, channel))]: map[key] }
		})

		return result.sort(sort)
	}
}

/**
 * sort aggregated data for mark rendering
 * @param {object} s Vega Lite specification
 * @returns {function} sort comparator function
 */
const _sortMarkData = s => {
	// just select the first matching encoding because
	// multidimensional sort doesn't work at the mark level
	const channel = Object.entries(s.encoding).find(([, channel]) => channel.sort)?.[0]

	if (!channel) {
		return sortNone()
	} else {
		const raw = values(s)
		const order = raw.map(encodingValue(s, channel)).sort(sorter(s, channel))
		const aggregatedValue = createAccessors(s)[channel]

		return (a, b) => {
			return order.indexOf(aggregatedValue(a)) - order.indexOf(aggregatedValue(b))
		}
	}
}
const sortMarkData = memoize(_sortMarkData)

/**
 * select sort comparator function
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @returns {string} sort comparator type
 */
const selectSorter = (s, channel) => {
	const sort = s.encoding[channel]?.sort

	if (isContinuous(s, channel)) {
		return 'natural'
	} else if (isDiscrete(s, channel)) {
		if (Array.isArray(sort)) {
			return 'array'
		} else if (!sortField(s, channel)) {
			return 'none'
		} else if (sort.field) {
			return 'field'
		} else if (sort.encoding || (typeof sort === 'string' && !orders.includes(sort))) {
			return 'channel'
		} else if (sort) {
			return 'natural'
		}
	}
}

/**
 * select a simple comparator function to as part
 * of more elaborate sort functions
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} sort comparator function
 */
const selectComparator = (s, channel) => {
	if (isAscending(s, channel)) {
		return ascending
	} else if (isDescending(s, channel)) {
		return descending
	} else {
		return sortNone()
	}
}

/**
 * wrapper for natural sort comparator
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} natural sort comparator function
 */
const sortNatural = (s, channel) => {
	const comparator = selectComparator(s, channel)

	return (a, b) => {
		return comparator(a, b)
	}
}

/**
 * field sort comparator
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} field sort comparator function
 */
const sortByField = (s, channel) => {
	const comparator = selectComparator(s, channel)
	const sortValue = encodingValue(s, sortChannel(s, channel))

	const sort = (a, b) => {
		return comparator(sortValue(a), sortValue(b))
	}
	const order = valuesToSort(s, channel).sort(sort).map(encodingValue(s, channel))

	return (a, b) => {
		return order.indexOf(a) - order.indexOf(b)
	}
}

/**
 * encoding channel sort comparator
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} encoding channel sort comparator function
 */
const sortByChannel = (s, channel) => {
	const { sort } = s.encoding[channel]
	let sortChannel

	if (typeof sort === 'object') {
		sortChannel = sort.encoding
	} else if (typeof sort === 'string') {
		sortChannel = isInverted(sort) ? sort.slice(1) : sort
	}

	const value = encodingValue(s, sortChannel)
	const comparator = selectComparator(s, channel)

	const order = valuesToSort(s, channel)
		.sort((a, b) => {
			return comparator(value(a), value(b))
		})
		.map(encodingValue(s, channel))

	return (a, b) => {
		return order.indexOf(a) - order.indexOf(b)
	}
}

/**
 * array sort comparator
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} array sort comparator function
 */
const sortByArray = (s, channel) => {
	const order = s.encoding[channel].sort

	return (a, b) => {
		if (!order.includes(a) && order.includes(b)) {
			return 1
		} else if (order.includes(a) && !order.includes(b)) {
			return -1
		}

		return order.indexOf(a) - order.indexOf(b)
	}
}

/**
 * null sort comparator
 * @returns {function} noop sort comparator function
 */
const sortNone = () => () => 0

/**
 * create sort comparator function
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding channel
 * @returns {function} sort comparator
 */
const _sorter = (s, channel) => {
	try {
		if (selectSorter(s, channel) === 'channel') {
			return sortByChannel(s, channel)
		} else if (selectSorter(s, channel) === 'array') {
			return sortByArray(s, channel)
		} else if (selectSorter(s, channel) === 'field') {
			return sortByField(s, channel)
		} else if (selectSorter(s, channel) === 'natural') {
			return sortNatural(s, channel)
		} else if (selectSorter(s, channel) === 'none') {
			return sortNone()
		}
	} catch (error) {
		const sort = s.encoding[channel]?.sort

		throw new Error(
			`could not sort encoding ${channel} by ${
				typeof sort === 'string' ? sort : JSON.stringify(sort)
			} - ${error.message}`
		)
	}
}
const sorter = memoize(_sorter)

export { sorter, sortMarkData }
