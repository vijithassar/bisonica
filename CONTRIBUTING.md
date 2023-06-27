# API

bisonica follows the API for [Vega Lite](https://vega.github.io/vega-lite/). Not all Vega Lite features are implemented. If there's one you like, please feel free to add it!

# Architecture

Library architecture relies on the principles outlined by the [Grammar of Graphics](https://link.springer.com/book/10.1007/0-387-28695-0).

# Internals

## Visual Attributes

Visual attributes like color, shape, and position should always be controlled by `encodings.js`, which can itself be thought of as a composition of `accessors.js` and `scales.js` which first looks up the data value and then passes it to [`d3-scale`](https://github.com/d3/d3-scale).

## Conditionals

For important conditional logic it's often useful to add a new method to `feature.js` which can then be used in place of JSON lookups. In particular, this helps make sure the conditional is properly checked when specifications use [view composition](https://vega.github.io/vega-lite/docs/composition.html).
