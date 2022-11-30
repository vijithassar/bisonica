import * as d3 from 'd3'
import { data, sumByCovariates } from './data.js'
import { colors } from './color.js'
import { encodingChannelQuantitative, encodingType, encodingValue } from './encodings.js'
import { feature } from './feature.js'
import { identity, isDiscrete, values } from './helpers.js'
import { memoize } from './memoize.js'
import { parseTime, temporalBarDimensions } from './time.js'
import { sorter } from './sort.js'

const defaultDimensions = { x: 0, y: 0 }

/**
 * make a normal function appear to be a scale function
 * by adding domain and range methods
 * @param {function} scale scale function
 * @param {array} domain scale domain
 * @param {array} range scale range
 * @returns {function} scale function with mocked domain and range
 */
const syntheticScale = (scale, domain, range) => {
  return Object.assign(scale, { domain: () => domain, range: () => range })
}

/**
 * parse scale types which have been explicitly specified
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {'scaleSymlog'|null}
 */
const explicitScale = (s, channel) => {
  if (s.encoding[channel]?.scale === null) {
    return null
  }
  if (
    s.encoding[channel]?.scale?.type === 'symlog' &&
    encodingType(s, channel) === 'quantitative'
  ) {
    return 'scaleSymlog'
  }
}

/**
 * determine the d3 method name of the scale function to
 * generate for a given dimension of visual encoding
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {string|null} d3 scale type
 */
const scaleMethod = (s, channel) => {
  if (s.encoding[channel]?.scale?.type || s.encoding[channel]?.scale === null) {
    return explicitScale(s, channel)
  }
  let methods = {
    temporal: 'scaleUtc',
    nominal: 'scaleOrdinal',
    quantitative: 'scaleLinear',
    ordinal: 'scaleOrdinal',
  }

  let method

  if (['x', 'y'].includes(channelRoot(s, channel)) && isDiscrete(s, channel)) {
    if (feature(s).isBar()) {
      method = 'scaleBand'
    } else {
      method = 'scalePoint'
    }
  } else {
    method = methods[encodingType(s, channel)]
  }
  if (typeof d3[method] === 'function') {
    return method
  } else {
    throw new Error(
      `could not determine scale method for ${channel} channel because encoding type is ${encodingType(s, channel)}`,
    )
  }
}

/**
 * get the specified domain from a specification
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {array} domain
 */
const customDomain = (s, channel) => {
  const domain = s.encoding[channel]?.scale?.domain

  if (domain) {
    if (encodingType(s, channel) === 'temporal') {
      return domain.map(parseTime)
    } else {
      return domain
    }
  }
}

/**
 * determine whether a given channel is text based
 * @param {string} channel encoding parameter
 * @returns {boolean} whether the field is text based
 */
const isTextChannel = (channel) => {
  return ['href', 'text', 'tooltip', 'description'].includes(channel)
}

/**
 * sanitize channel name
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {string} visual encoding channel
 */
const channelRoot = (s, channel) => {
  return channel.endsWith('2') ? channel.slice(0, -1) : channel
}

/**
 * compute raw values for scale domain
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {number[]} domain
 */
const domainBaseValues = (s, channel) => {
  const type = encodingType(s, channel)

  if (channel === 'color') {
    const colors = Array.from(new Set(values(s).map(encodingValue(s, 'color'))))

    return colors
  }

  if (type === 'temporal') {
    const date = (d) => parseTime(encodingValue(s, channel)(d)).getTime()

    return d3.extent(values(s), date)
  } else if (type === 'nominal' || type === 'ordinal') {
    return [...new Set(values(s).map((item) => encodingValue(s, channel)(item)))]
  } else if (type === 'quantitative') {
    if (channel === 'theta') {
      return [0, 360]
    }

    let min
    let max

    if (feature(s).isBar() || feature(s).isArea()) {
      min = 0
      max = d3.max(sumByCovariates(s))
    } else if (feature(s).isLine()) {
      const byPeriod = data(s)
        .map((item) => item.values)
        .flat()
      const nonzero = s.encoding.y.scale?.zero === false
      const accessor = (d) => d.value
      const periodMin = d3.min(byPeriod, accessor)
      const positive = typeof periodMin === 'number' && periodMin > 0

      if (nonzero && positive) {
        min = periodMin
      } else if (!positive) {
        min = periodMin
      } else {
        min = 0
      }

      max = d3.max(byPeriod, accessor)
    } else {
      min = 0
      max = d3.max(values(s), encodingValue(s, channel))
    }

    return [min, max]
  } else {
    return d3.extent(values(s), (item) => encodingValue(s, channel)(item))
  }
}

/**
 * sort the domain
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @returns {function}
 */
const domainSort = (s, channel) => {
  if (!s.encoding[channel].sort || s.encoding[channel].sort === null) {
    return identity
  }

  return (domain) => domain.slice().sort(sorter(s, channel))
}

/**
 * compute domain
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 */
const domain = (s, channel) => {
  return customDomain(s, channel) || domainSort(s, channel)(domainBaseValues(s, channel))
}

/**
 * compute scale range
 * @param {object} s Vega Lite specification
 * @param {string} dimensions chart dimensions
 * @param {string} _channel visual encoding
 * @returns {number[]} range
 */
const range = (s, dimensions, _channel) => {
  const channel = channelRoot(s, _channel)
  const cartesian = () => {
    let result

    if (isDiscrete(s, channel) && !['scaleBand', 'scalePoint'].includes(scaleMethod(s, channel))) {
      const count = domain(s, channel).length
      const interval = dimensions[channel] / count

      const positions = Array.from({ length: count }).map((item, index) => index * interval)

      result = positions
    } else {
      const start = 0
      const end = feature(s).isTemporalBar() ? temporalBarDimensions(s, dimensions)[channel] : dimensions[channel]
      result = [start, end]
    }

    if (channel === 'y' && encodingType(s, channel) === 'quantitative') {
      result.reverse()
    }

    return result
  }
  const ranges = {
    x: cartesian,
    y: cartesian,
    color: () => {
      let colorRangeProcessor

      if (feature(s).isRule()) {
        colorRangeProcessor = identity
      } else {
        colorRangeProcessor = data
      }

      return (
        s.encoding.color?.scale?.range ||
        colors((customDomain(s, channel) || colorRangeProcessor(s)).length)
      )
    },
    theta: () => [0, Math.PI * 2],
  }

  return ranges[channel]()
}

/**
 * generate scale functions described by the
 * specification's encoding section
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {object} hash of d3 scale functions
 */
const coreScales = (s, dimensions) => {
  if (typeof s.encoding !== 'object') {
    return
  }

  const scales = {}

  Object.entries(s.encoding).forEach(([channel, definition]) => {
    if (definition !== null && definition.value) {
      scales[channel] = () => definition.value
    }

    if (definition.datum && isTextChannel(channel)) {
      scales[channel] = identity
    }
  })

  Object.entries(s.encoding)
    .filter(([channel]) => !isTextChannel(channel) && !scales[channel])
    .forEach(([channel]) => {
      try {
        const method = scaleMethod(s, channelRoot(s, channel))
        if (method === null) {
          scales[channel] = syntheticScale(identity, domain(s, channel), range(s, dimensions, channel))
        } else {
          const scale = d3[method]().domain(domain(s, channel)).range(range(s, dimensions, channel))

          if (method === 'scaleLinear') {
            scale.nice()
          }

          scales[channel] = scale
        }
      } catch (error) {
        error.message = `could not generate ${channel} scale - ${error.message}`
        throw error
      }
    })

  if (!scales.color && !feature(s).isMulticolor()) {
    scales.color = () => colors(1).pop()
  }

  return scales
}

/**
 * determine whether a specification describes a chart that
 * will require scale functions beyond the ones listed directly
 * in the s's encoding section
 * @param {object} s Vega Lite specification
 * @returns {string[]} additional scale functions required
 */
const detectScaleExtensions = (s) => {
  const extensions = []

  if (feature(s).isBar() || feature(s).isArea()) {
    extensions.push('length')
  }

  if (feature(s).isText() && !s.mark.text && s.encoding.text.field) {
    extensions.push('text')
  }

  return extensions
}

/**
 * generate additional necessary scale functions beyond those
 * described in the s's encoding section
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @param {object} scales a hash of the core scale functions
 * @returns {object} hash of extended d3 scale functions
 */
const extendScales = (s, dimensions, scales) => {
  const extendedScales = { ...scales }
  const extensions = detectScaleExtensions(s)

  if (extensions.includes('length')) {
    const channel = encodingChannelQuantitative(s)

    extendedScales.length = (d) => {
      if (extendedScales[channel].domain().every((endpoint) => endpoint === 0)) {
        return 0
      }

      if (channel === 'y') {
        return dimensions[channel] - extendedScales[channel](d)
      } else if (channel === 'x') {
        return extendedScales[channel](d)
      }
    }

    extendedScales.start = (d) => {
      if (channel === 'y') {
        return extendedScales[channel](d[0]) - extendedScales.length(d[1] - d[0])
      } else if (channel === 'x') {
        return extendedScales[channel](d[0])
      }
    }
  }

  if (extensions.includes('text')) {
    extendedScales.text = (d) => `${d}`
  }

  return extendedScales
}

const _parseScales = (s, dimensions = defaultDimensions) => {
  const core = coreScales(s, dimensions)
  const extended = extendScales(s, dimensions, core)

  return extended
}

/**
 * generate all scale functions necessary to render a s
 * @param {object} s Vega Lite specification
 * @param {object} [dimensions] chart dimensions
 * @returns {object} hash of all necessary d3 scale functions
 */
const parseScales = memoize(_parseScales)

export { colors, parseScales }
