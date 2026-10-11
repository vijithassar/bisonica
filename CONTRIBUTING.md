# API

bisonica follows the API for [Vega Lite](https://vega.github.io/vega-lite/). Not all Vega Lite features are implemented. If there's one you like, please feel free to add it!

# Documentation

Internals are thoroughly documented with [JSDoc](https://jsdoc.app/). To build the documentation locally, run `npm run documentation` and then view the generated HTML files in your web browser.

# Architecture

bisonica is not a collection of charts. It is structured a lot more like a compiler in which the output is a graphic. The functions are largely separated and designed to operate across all possible charts. If you want to make a change to the way colors behave inside bar chart, you'll end up working in generalized functions with names like `colors()` rather than inside a particular conditional branch within a `barChart()` function. The functions are loosely coupled and joined together at the last minute by the `mark.js` module, which is the closest thing you'll find to a set of traditional chart definitions.

Module divisions largely follow the principles outlined by the [Grammar of Graphics](https://link.springer.com/book/10.1007/0-387-28695-0).

# Internals

## Memoization

Functional programming is not just stylistic taste, and memoized pure functions are not just performance improvements – they are architecturally load bearing. Ambitiuous use of memoization means functions can be loosely coupled and executed repeatedly almost arbitrarily, which keeps the codebase clean. You typically won't need to thread computed values around through complex function stacks. Instead, you can memoize the function and invoke it wherever the value it returns is actually required.

## Visual Attributes

Visual attributes like color, shape, and position should always be controlled by `encodings.js`, which can itself be thought of as a composition of `accessors.js` and `scales.js` which first looks up the data value and then passes it to [`d3-scale`](https://github.com/d3/d3-scale).

## Conditionals

For important conditional logic it's often useful to add a new method to `feature.js` which can then be used in place of JSON lookups. In particular, this helps make sure the conditional is properly checked when specifications use [view composition](https://vega.github.io/vega-lite/docs/composition.html).
