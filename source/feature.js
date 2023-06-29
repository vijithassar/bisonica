/**
 * collect conditional tests based on object lookups into reusable functions
 * @module feature
 */

import { encodingType, encodingValue } from './encodings.js'
import { layerTestRecursive } from './views.js'
import { mark } from './helpers.js'
import { memoize } from './memoize.js'
import { values } from './values.js'

// this is a mistake
// import { isPresent } from '@ember/utils';
const isPresent = x => x !== null

const _feature = s => {
	const multicolorTest = s => {
		const colorValues = [
			...(Array.from(new Set(values(s))) || [])
				.map(encodingValue(s, 'color'))
				.filter(item => !!item)
		]

		return s.encoding?.color && colorValues.length > 1
	}

	const isMulticolor = layerTestRecursive(s, multicolorTest)

	const temporalTest = s => {
		return Object.keys(s.encoding || {}).some(channel => encodingType(s, channel) === 'temporal')
	}
	const isTemporal = layerTestRecursive(s, temporalTest)

	const tests = {
		isBar: s => mark(s) === 'bar',
		isLine: s => mark(s) === 'line',
		isArea: s => mark(s) === 'area',
		hasPoints: s => ['point', 'circle', 'square'].includes(mark(s)) || s.mark?.point === true || s.mark?.point === 'transparent',
		hasPointsFilled: s => (mark(s) !== 'point') && (s.mark?.filled !== false) && s.mark?.point !== 'transparent',
		hasLayers: s => s.layer,
		isCircular: s => mark(s) === 'arc',
		isRule: s => mark(s) === 'rule',
		isText: s => mark(s) === 'text',
		isImage: s => mark(s) === 'image',
		hasColor: s => s.encoding?.color,
		hasLinks: s => s.encoding?.href || s.mark?.href,
		hasData: s => s.data?.values?.length || s.data?.url,
		hasLegend: s => s.encoding?.color && s.encoding?.color?.legend !== null,
		hasLegendTitle: s => isPresent(s.encoding?.color?.legend?.title),
		hasTooltip: s => s.mark?.tooltip || s.encoding?.tooltip,
		hasTransforms: s => Array.isArray(s.transform),
		hasAxisX: s => s.encoding?.x && s.encoding?.x.axis !== null,
		hasAxisY: s => s.encoding?.y && s.encoding?.y.axis !== null,
		hasAxisLabelsY: s => s.encoding?.y?.axis?.labels !== false,
		hasAxisLabelsX: s => s.encoding?.x?.axis?.labels !== false,
		hasAxisTitleX: s => s.encoding?.x?.axis?.title !== null,
		hasAxisTitleY: s => s.encoding?.y?.axis?.title !== null,
		hasStaticText: s => s.mark?.text && !s.encoding?.text,
		hasTable: s => s.usermeta?.table !== null,
		hasDownload: s => s.usermeta?.download !== null,
		isCartesian: s => (s.encoding?.x && s.encoding?.y),
		isLinear: s => (s.encoding?.x && !s.encoding?.y) || (s.encoding?.y && !s.encoding?.x),
		isTemporal: () => isTemporal,
		isMulticolor: () => isMulticolor,
		hasEncodingX: s => s.encoding?.x,
		hasEncodingY: s => s.encoding?.y,
		hasEncodingColor: s => s.encoding?.color,
		hasRadius: s => s.encoding?.radius,
		isStacked: s => {
			return ['bar', 'area'].includes(mark(s)) &&
				s.encoding?.y?.stack !== null &&
				s.encoding?.y?.stack !== false &&
				s.encoding?.x?.stack !== null &&
				s.encoding?.x?.stack !== false &&
				isMulticolor
		}
	}

	tests.hasAxis = s => tests.hasEncodingX(s) || tests.hasEncodingY(s)

	tests.isTemporalBar = s => tests.isBar(s) && isTemporal

	const layerTests = {}

	Object.entries(tests).forEach(([key, test]) => {
		layerTests[key] = memoize(() => {
			return !!layerTestRecursive(s, test)
		})
	})

	return layerTests
}

/**
 * use simple heuristics to determine features the chart type
 * @param {object} s Vega Lite specification
 * @return {object} methods for boolean feature tests
 */
const feature = memoize(_feature)

export { feature }
