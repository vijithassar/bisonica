# Overview

bisonica is a minimalist and accessibility-first alternative renderer for the open source [Vega Lite](https://vega.github.io/vega-lite/) standard for data visualization, a replacement for the [original `vega-lite.js` library](https://github.com/vega/vega-lite) which reads in the same [JSON configuration objects](https://vega.github.io/vega-lite/docs/) and outputs charts.

# Install

Install from [npm](https://www.npmjs.com/package/bisonica) using your tool of choice. For example:

```bash
npm install bisonica
```

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

# Specifications

In the preceding code, the `specification` variable is a JSON object that describes the chart according to the [Vega Lite](https://vega.github.io/vega-lite/) open standard. Explaining the structure of that object is beyond the scope of the bisonica documentation and would be duplicative in any case. Instead, please refer to the excellent [examples](https://vega.github.io/vega-lite/examples/), [API documentation](https://vega.github.io/vega-lite/docs/), and [tutorials](https://vega.github.io/vega-lite/tutorials/getting_started.html) provided by the Vega Lite project.

# Tooltips

Vega Lite and bisonica both support attaching tooltips to chart content if the specification requests it. Please see the [Vega Lite tooltip documentation](https://vega.github.io/vega-lite/docs/tooltip.html) for more details on the numerous useful ways this can be configured.

By default, bisonica renders tooltip content as [svg `<title>` nodes](https://developer.mozilla.org/en-US/docs/Web/SVG/Reference/Element/title) within each piece of the chart, which browsers typically reveal on mouseover.

You can also add your own custom tooltips by calling the `.tooltip()` method attached to a chart renderer and passing it an arbitrary function.

```javascript
const renderer = chart(specification, dimensions);
renderer.tooltip(myCustomTooltipFunction);
```

When it is called, your tooltip function will be passed an object containing the data point, the SVG DOM node, the browser event, and key/value pairs of any data fields itemized in the specification object used to create the chart.

Note that the tooltip API is only loosely defined in the Vega Lite standard and also has not yet stabilized in bisonica.

# Why?

## Accessibility

When faced with an accessibility concern, bisonica typically just defaults to the most accessible option, whereas `vega-lite.js` might require more elaborate JSON in the specification object in order to achieve the same result. Some accessibility features such as the keyboard navigation and audio sonification cannot be replicated with the standard `vega-lite.js` renderer at all.

## Performance

bisonica is often considerably faster than rendering the same chart using `vega-lite.js`. This will depend on the specific chart configuration and the input data, but as an example, pie charts have been clocked rendering in as little as 1.25 milliseconds.

## Customization

Unlike `vega-lite.js`, bisonica renders legends as HTML next to the SVG instead of inside the SVG, and as a result they are much easier to restyle with CSS or even control with custom JavaScript behaviors.

# Comparison

In general, bisonica may be a good choice if you need to render straightforward charts with strong accessibility properties using Vega Lite's JSON as the backing format and you can handle writing the custom CSS that will probably be necessary to get the generated graphics over the finish line for your use case.

On the other hand, the standard `vega-lite.js` renderer is definitely still the way to go if you need its more elaborate graphical options, [faceted trellis plots](https://vega.github.io/vega-lite/docs/facet.html), charts which don't rely on custom styling, a dynamic exploratory workflow powered by [evaluating string expressions](https://github.com/vega/vega-expression), or any of the features bisonica has intentionally omitted.

## Omissions

bisonica is still a work in progress and as such supports only a subset of Vega Lite functionality. The supported chart forms are listed in [`marks.js`](./source/marks.js).

Data loading will not [parse inline strings](https://vega.github.io/vega-lite/docs/data.html#inline).

Nested fields must be looked up using dot notation (e.g. `datum.field`), not bracket notation (e.g. `datum['field']`).

[Predicates](https://vega.github.io/vega-lite/docs/predicate.html) defined with string expressions only support simple comparisons (e.g. `"datum.value < 100"` or `"datum.group === 'a'"`).

The [calculate transform](https://vega.github.io/vega-lite/docs/calculate.html) only supports deriving new fields with string concatenation and static functions but can't do arbitrary math. (If you need arbitrary math, do it in JavaScript and attach the results to your specification before rendering.)

Escaping special characters in field names is not supported. Instead, you should mutate your data before rendering to clean up the affected field names.

[Geographic maps](https://vega.github.io/vega-lite/examples/#maps-geographic-displays) are not implemented.

Advanced Vega Lite features like [`facet`](https://vega.github.io/vega-lite/docs/composition.html#faceting) and [`parameters`](https://vega.github.io/vega-lite/docs/parameter.html) are not yet available.

Rendering to alternative output formats such as `<canvas>` instead of `<svg>` will most likely never be supported.

# Errors

## Throwing

Errors inside the chart library are nested, and error handling typically appends information to `error.message` and then re-throws the same error object. This naturally has the effect of augmenting the messages generated by the runtime with written explanations meant for humans at every layer of the stack, sort of a "semantic stack trace."

## Catching

To set a custom error handler, pass a function to the `.error()` method.

```javascript
// create a chart renderer
const renderer = chart(specification, dimensions)

// error handling function
const errorHandler = (error) => alert(error.message);

// attach the error handling function to the chart renderer
renderer.error(errorHandler);
```

By default, errors are handled at the top level with `console.error`, equivalent to `renderer.error(console.error)`.

## Disabling

To disable default trapping of errors and instead surface the semantic stack traces to the consumer:

```javascript
// disable catching and allow errors
// to propagate up to the caller
renderer.error(null);
```

You'll then want to handle these in your page or application.
