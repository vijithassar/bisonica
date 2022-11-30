const WRAPPER_CLASS = 'wrapper'

const BAR_WIDTH_MINIMUM = 2

const GRID = 10

const MINIMUM_TICK_COUNT = 3

const RENDER_FREQUENCY = 32

/**
 * custom behavior for opening links when mark nodes are
 * clicked
 *
 * - false uses window.open()
 * - true disables window.open()
 * - function disables window.open() and then executes
 * with the url and the node as the arguments
 * @type {boolean|function}
 */
const customLinkHandler = true

export {
	WRAPPER_CLASS,
	GRID,
	MINIMUM_TICK_COUNT,
	BAR_WIDTH_MINIMUM,
	RENDER_FREQUENCY,
	customLinkHandler
}
