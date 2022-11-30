import { GRID, WRAPPER_CLASS } from './config.js'
import { feature } from './feature.js'
import { longestAxisTickLabelTextWidth, rotation } from './text.js'
import { memoize } from './memoize.js'
import { polarToCartesian } from './helpers.js'
import { radius } from './marks.js'
import { layerPrimary } from './views.js'

const TITLE_MARGIN = GRID * 5
const MARGIN_MAXIMUM = 180 + TITLE_MARGIN

const axes = { x: 'bottom', y: 'left' }

/**
 * compute margin for a circular chart
 * @returns {object} D3 margin convention object
 */
const marginCircular = () => {
  return {
    top: 0,
    right: 0,
    bottom: 0,
    left: 0
  }
}

/**
 * compute margin for Cartesian chart axis ticks
 * @param {object} s Vega Lite specification
 * @returns {object} D3 margin convention object
 */
const tickMargin = (s) => {
  const textLabels = longestAxisTickLabelTextWidth(s)
  const result = {}

  Object.entries(axes).forEach(([channel, position]) => {
    const angle = rotation(s, channel)

    if (textLabels[channel] && typeof angle === 'number') {
      const coordinates = polarToCartesian(textLabels[channel], angle)
      const opposite = Object.keys(axes).find((axis) => axis !== channel)
      const margin = Math.abs(coordinates[opposite])

      result[position] = Math.min(MARGIN_MAXIMUM, margin + GRID)
    }
  })

  return result
}

/**
 * compute margin for Cartesian chart axis title
 * @param {object} s Vega Lite specification
 * @returns {object} D3 margin convention object
 */
const titleMargin = (s) => {
  return {
    bottom: feature(s).hasAxisTitleX() ? TITLE_MARGIN : 0,
    left: feature(s).hasAxisTitleY() ? TITLE_MARGIN : 0
  }
}

/**
 * compute margin for Cartesian chart
 * @param {object} s Vega Lite specification
 * @returns {object} D3 margin convention object
 */
const marginCartesian = (s) => {
  const defaultMargin = {
    top: GRID * 2,
    right: GRID * 2,
    bottom: GRID * 4,
    left: GRID * 4
  }

  const dynamicMargin = {}

  Object.values(axes).forEach((position) => {
    dynamicMargin[position] =
      tickMargin(s)?.[position] + titleMargin(s)?.[position] + GRID
  })

  return {
    top: defaultMargin.top,
    right: defaultMargin.right,
    bottom: dynamicMargin.bottom || defaultMargin.bottom,
    left: dynamicMargin.left || defaultMargin.left
  }
}

const _margin = (s) => {
  if (feature(s).isCircular()) {
    return marginCircular()
  } else {
    return marginCartesian(layerPrimary(s))
  }
}

/**
 * compute margin values based on chart type
 * @param {object} s Vega Lite specification
 * @returns {object} D3 margin convention object
 */
const margin = memoize(_margin)

/**
 * transform string for positioning charts
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} positioning function
 */
const position = (s, dimensions) => {
  const yOffsetCircular =
    dimensions.x > dimensions.y ? (dimensions.y - radius(dimensions) * 2) * 0.5 : 0
  const middle = {
    x: dimensions.x * 0.5,
    y: dimensions.y * 0.5 + yOffsetCircular
  }

  let margins

  const { left, top } = margin(s, dimensions)

  margins = {
    x: left,
    y: top
  }

  const transform = feature(s).isCircular() ? middle : margins
  const transformString = `translate(${transform.x},${transform.y})`

  return (selection) => {
    selection.select(`g.${WRAPPER_CLASS}`).attr('transform', transformString)
  }

}

export { margin, tickMargin, position }
