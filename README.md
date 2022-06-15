This is an alternative renderer for the [Vega Lite](https://vega.github.io/vega-lite/) data visualization format, built to increase speed, accessibility, and security.

It is still a work in progress and as such supports only a subset of Vega Lite functionality. The supported chart forms are listed in `source/marks.js`.

To use:

```javascript
import { chart } from 'bisonica';

const dimensions = {
    x: 500,
    y: 500
};

d3.select(node).call(chart(specification, dimensions));
```

A more verbose example including markup:

```html
<html>
    <head>
        <meta charset="utf-8" />
        <link rel="stylesheet" href="./source/index.css" />
        <script type="text/javascript" src="//d3js.org/d3.v6.js"></script>
        <script type="module">
            import { chart } from './build/charts.js'

            const specification = {
                "title": {
                    "text": "demo"
                },
                "data": {
                    "values": [
                        { value: 1, group: 'z' },
                        { value: 2, group: 'y' },
                        { value: 3, group: 'x' },
                        { value: 4, group: 'w' },
                        { value: 5, group: 'v' }
                    ]
                },
                "mark": {type: "arc", innerRadius: 50},
                "encoding": {
                    "theta": {field: "value", type: "quantitative"},
                    "color": {field: "group", type: "nominal"}
                }
            }
            d3.select('main .chart').call(chart(specification, {x: 500, y: 500}))
        </script>
    </head>
    <body>
        <main>
            <div class="chart"></div>
        </main>
    </body>
</html>
```