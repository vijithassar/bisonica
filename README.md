# Overview

bisonica is a minimalist and accessibility-first alternative renderer for the [Vega Lite](https://vega.github.io/vega-lite/) data visualization format, a replacement for the [original `vega-lite.js` library](https://github.com/vega/vega-lite) which reads in the same JSON configuration objects and outputs charts.

# Quick Start

The `chart()` function takes a Vega Lite JSON specification object and uses it to create a chart rendering function which can be run using [`d3-selection`](https://github.com/d3/d3-selection).

```javascript
import { select } from 'd3';
import { chart } from 'bisonica';

const dimensions = {
    x: 500,
    y: 500
};

// create a chart rendering function
const renderer = chart(specification, dimensions);

// render the chart
renderer(select('div'));
```

Or the equivalent syntax with `selection.call()`:

```javascript
// render the chart
select('div').call(renderer);
```


You'll probably want to load the included stylesheet? Feel free to use your own alternative if you want, though.

You can load it directly:

```html
<head>
    <link rel="stylesheet" href="./source/index.css" />
</head>
```

Or import with a packager or build tool:

```javascript
import "bisonica/styles.css";
```

# Why?

## Accessibility

When faced with an accessibility concern, bisonica typically just defaults to the most accessible option, whereas `vega-lite.js` might require more elaborate JSON in the specification object in order to achieve the same result. Some accessibility features such as the built in keyboard navigation may not be possible to replicate with the standard `vega-lite.js` renderer at all.

## Performance

bisonica is often considerably faster than rendering the same chart using `vega-lite.js`. This will depend on the specific chart configuration and the input data, but as an example, pie charts have been clocked rendering in as little as 1.25 milliseconds.

## Customization

Unlike `vega-lite.js`, bisonica renders legends as HTML next to the SVG instead of inside the SVG, and as a result they are much easier to restyle with CSS or even control with custom JavaScript behaviors.

# Omissions

bisonica is still a work in progress and as such supports only a subset of Vega Lite functionality. The supported chart forms are listed in [`source/marks.js`](./source/marks.js).

Data must be supplied [inline](https://vega.github.io/vega-lite/docs/data.html#inline) as an array of JavaScript objects attached to `specification.data.values`.

Advanced Vega Lite features like [`facet`](https://vega.github.io/vega-lite/docs/composition.html#faceting) and [`parameters`](https://vega.github.io/vega-lite/docs/parameter.html) are not yet available.

Rendering to alternative output formats such as `<canvas>` instead of SVG will most likely never be supported.
