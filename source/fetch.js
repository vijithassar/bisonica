import * as d3 from 'd3'

/**
 * fetch remote data
 * @param {object} s Vega Lite specification
 * @returns {Promise<object[]>} data set
 */
const fetch = async s => await d3[s.data.format?.type || 'json'](s.data.url)

export { fetch }
