/**
 * Vega Lite specification
 * @typedef specification
 * @property {object} title title
 * @property {object} [description] description
 * @property {object} data data
 * @property {object} [datasets] datasets
 * @property {object} encoding encoding parameters for chart graphics
 * @property {object|string} mark mark for rendering chart
 * @property {object} [transform] transforms
 * @property {object} [usermeta] arbitrary extensions
 * @property {object} [layer] layers
 * @property {object} [facet] facets
 */

/**
 * chart dimensions
 * @typedef dimensions
 * @property {number} x horizontal dimension
 * @property {number} y vertical dimension
 */

/**
 * encoding channel in cartesian space
 * @typedef {'x'|'y'} cartesian
 */

/**
 * margin convention object
 * @typedef margin
 * @property {number} top top margin
 * @property {number} right right margin
 * @property {number} bottom bottom margin
 * @property {number} left left margin
 * @see {@link https://observablehq.com/@d3/margin-convention|margin convention}
 */

/**
 * @typedef {('path'|'circle'|'rect'|'line'|'image'|'text')} mark
 */

/**
 * @typedef {('audio'|'color'|'description'|'download'|'id'|'menu'|'table')} extension
 */
