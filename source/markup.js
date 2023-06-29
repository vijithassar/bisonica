/**
 * generate additional data attributes to be used in tests for DOM nodes
 * @module markup
 */

const selectors = [
	'.graphic',
	'svg',
	'svg > title',
	'.wrapper',
	'.layer',
	'.marks',
	'.mark',
	// marks types are more specific and need to come after the more general .mark above
	'.marks .mark.point',
	'.marks .mark.text',
	'.axes',
	'.axes .x',
	'.axes .x .title',
	'.axes .x .tick',
	'.axes .y',
	'.axes .y .title',
	'.axes .y .tick',
	'.mark title',
	'.point title',
	'.tick',
	'.legend',
	'.legend .pair',
	'.legend .items-main',
	'.legend .items-more',
	'.menu .item'
]

/**
 * remove dot
 * @param {string} selector DOM selector string
 * @return {string} sanitized
 */
const stripDots = selector => {
	const leading = selector.slice(0, 1) === '.'
	let result

	result = leading ? selector.slice(1) : selector

	return result.replace(/\./g, '-')
}

/**
 * filter out unwanted segments from CSS selectors
 * @param {string} segment DOM selector string
 * @return {boolean} string match
 */
const isAllowedSegment = segment => {
	return segment !== '>'
}

/**
 * convert a selector string into a data attribute value
 * @param {string} selector DOM selector string
 * @return {string} attribute
 */
const convertToTestSelector = selector => {
	return selector.split(' ').map(stripDots).filter(isAllowedSegment).join('-')
}

/**
 * add test selector attributes
 * @param {object} selection d3 selection
 */
const testAttributes = selection => {
	selectors.forEach(selector => {
		selection.selectAll(selector).attr('data-test-selector', convertToTestSelector(selector))
	})
}

export { testAttributes }
