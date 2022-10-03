import {
  layerCall,
  layerMatch,
  layerNode,
  layerPrimary
} from '../../source/views.js';
import qunit from 'qunit';
import { parseScales } from '../../source/scales.js';
import * as d3 from 'd3';

const { module, test } = qunit;

module('unit > views', () => {
  module('layers', () => {
    const specifications = {
      data: { values: [1, 2, 3, 5, 6] },
      layer: [
        {
          mark: { type: 'rule' },
          encoding: { y: { datum: 10 } },
        },
        {
          mark: { type: 'bar' },
          encoding: { y: { scale: { domain: [0, 100] }, type: 'quantitative' } },
        },
      ],
    };
    const ruleTest = (s) => s.mark.type === 'rule';
    const barTest = (s) => s.mark.type === 'bar';

    test('resolves missing domains', (assert) => {
      const s = layerMatch(specifications, (s) => s.mark.type === 'rule');

      assert.deepEqual(s.encoding.y.scale.domain, specifications.layer[1].encoding.y.scale.domain);
    });
    test('resolves missing encoding types', (assert) => {
      const s = layerMatch(specifications, (s) => s.mark.type === 'rule');

      assert.equal(s.encoding.y.type, 'quantitative');
    });
    test('appends data to layer specifications', (assert) => {
      assert.equal(typeof layerMatch(specifications, barTest).data.values.length, 'number');
    });

    test('appends encoding to layer specifications', (assert) => {
      const encodingResolveTestSpecification = {
        data: { values: [{}] },
        encoding: {
          x: {
            field: 'a',
            type: 'quantitative',
          },
          y: {
            field: 'b',
            type: 'quantitative',
          },
        },
        layer: [{ mark: { type: 'point' } }, { mark: { type: 'text' } }],
      };
      const pointTest = (s) => s.mark.type === 'point';
      const layer = layerMatch(encodingResolveTestSpecification, pointTest);

      assert.equal(layer.encoding.x.field, 'a');
      assert.equal(layer.encoding.y.field, 'b');
    });

    test('matches nested layers', (assert) => {
      assert.equal(typeof layerMatch(specifications, ruleTest).encoding.y.datum, 'number');
      assert.equal(layerMatch(specifications, barTest).encoding.y.type, 'quantitative');
    });

    test('finds layer nodes', (assert) => {
      const markup = `
        <svg>
          <g class="layer" data-test-selector="a">
            <g class="marks">
              <line>
            </g>
          </g>
          <g class="layer" data-test-selector="b">
            <g class="marks">
              <rect>
            </g>
          </g>
        </svg>
      `;
      const wrapper = document.createElement('div');

      wrapper.innerHTML = markup;

      const ruleTest = (s) => s.mark.type === 'rule';
      const barTest = (s) => s.mark.type === 'bar';

      const ruleSpec = layerMatch(specifications, ruleTest);
      const barSpec = layerMatch(specifications, barTest);

      assert.equal(layerNode(ruleSpec, wrapper).getAttribute('data-test-selector'), 'a');
      assert.equal(layerNode(barSpec, wrapper).getAttribute('data-test-selector'), 'b');
    });
    module('primary', () => {
      test('circular', (assert) => {
        const specification = {
          data: {values: [
            { group: 'a', value: 1 },
            { group: 'b', value: 2 },
            { group: 'c', value: 3 },
          ]},
          layer: [
            {
              mark: {
                type: "text",
                text: "this is a text layer"
              }
            },
            {
              mark: {
                type: "arc",
                innerRadius: 50,
              },
              encoding: {
                theta: {
                  field: "value",
                  type: "quantitative"
                },
                color: {
                  field: "group",
                  type: "nominal"
                }
              }
            }
          ]
        };
        assert.equal(layerPrimary(specification).mark.type, 'arc', 'selects arcs from donut chart with text layer');
      });
      test('cartesian', (assert) => {
        const specification = {
          data: {
            values: [
              { date: "2015", value: 1 },
              { date: "2016", value: 2 },
              { date: "2017", value: 3 },
              { date: "2018", value: 4 },
              { date: "2019", value: 4 },
              { date: "2020", value: 7 },
              { date: "2021", value: 10 },
              { date: "2022", value: 4 },
            ]
          },
          layer: [
            {
              mark: {
                type: "rule"
              },
              encoding: {
                y: {
                  datum: 5,
                  type: 'quantitative'
                }
              }
            },
            {
              mark: {
                type: "line",
              },
              encoding: {
                theta: {
                  field: "value",
                  type: "quantitative"
                },
                color: {
                  field: "date",
                  type: "temporal"
                }
              }
            }
          ]
        };
        assert.equal(layerPrimary(specification).mark.type, 'line', 'selects line from line chart with rule layer');
      });      
      test('linear', (assert) => {
        const specification = {
          data: {
            values: [
              { group: "a", value: 21 },
              { group: "a", value: 44 },
              { group: "b", value: 57 },
              { group: "a", value: 82 },
              { group: "a", value: 23 },
              { group: "b", value: 10 },
              { group: "b", value: 30 },
              { group: "a", value: 57 },
            ]
          },
          layer: [
            {
              mark: {
                type: "text",
                text: 'text annotation'
              },
              encoding: {
                x: {
                  datum: 20,
                  type: 'quantitative'
                }
              }
            },
            {
              mark: {
                type: "point",
              },
              encoding: {
                x: {
                  field: "value",
                  type: "quantitative"
                },
                color: {
                  field: "group",
                  type: "nominal"
                }
              }
            }
          ]
        };
        assert.equal(layerPrimary(specification).mark.type, 'point', 'selects points from linear chart with text layer');
      });
      test('unions color domain', (assert) => {
        const specification = {
          "title": { "text": "layer color legend test specification" },
          "data": {
            "values": [
              {
                "a": "2016",
                "b": 10,
                "c": "_",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2017",
                "b": 20,
                "c": "_",
                "d": 10,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 10,
                "c": "_",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 40,
                "c": "_",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 60,
                "c": "_",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2021",
                "b": 80,
                "c": "_",
                "d": 30,
                "e": "<"
              },
              {
                "a": "2022",
                "b": 40,
                "c": "_",
                "d": 40,
                "e": "<"
              },
              {
                "a": "2016",
                "b": 50,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2017",
                "b": 60,
                "c": "•",
                "d": 30,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 50,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 30,
                "c": "•",
                "d": 40,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 10,
                "c": "•",
                "d": 60,
                "e": "<"
              },
              {
                "a": "2021",
                "b": 10,
                "c": "•",
                "d": 60,
                "e": ">"
              },
              {
                "a": "2022",
                "b": 20,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2016",
                "b": 70,
                "c": "+",
                "d": 50,
                "e": "<"
              },
              {
                "a": "2017",
                "b": 50,
                "c": "+",
                "d": 20,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 40,
                "c": "+",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 60,
                "c": "+",
                "d": 50,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 30,
                "c": "+",
                "d": 20,
                "e": "<"
              },
              {
                "a": "2021",
                "b": 10,
                "c": "+",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2022",
                "b": 20,
                "c": "+",
                "d": 50,
                "e": ">"
              }
            ]
          },
          "layer": [
            {
              "mark": {
                "type": "line"
              },
              "encoding": {
                "x": {
                  "field": "a",
                  "type": "temporal"
                },
                "y": {
                  "field": "b",
                  "type": "quantitative"
                },
                "color": {
                  "field": "e",
                  "type": "nominal"
                }
              }
            },
            {
              "mark": {
                "type": "bar"
              },
              "encoding": {
                "x": {
                  "field": "a",
                  "type": "temporal"
                },
                "y": {
                  "field": "d",
                  "type": "quantitative"
                },
                "color": {
                  "field": "c",
                  "type": "nominal"
                }
              }
            }
          ]
        };
        const domain = parseScales(layerPrimary(specification)).color.domain();
        assert.equal(domain.length, 5)

        const layers = [0, 1]
        const fields = layers.map((index) => specification.layer[index].encoding.color.field)
        const values = fields.map((field) => specification.data.values.map((item) => item[field])).flat()
        const unique = [...new Set(values)]

        unique.forEach((value) => {
          assert.ok(domain.includes(value))
        });
      });

      test('unions color range', (assert) => {
        const specification = {
          "title": { "text": "layer color legend test specification" },
          "data": {
            "values": [
              {
                "a": "2016",
                "b": 10,
                "c": "_",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2017",
                "b": 20,
                "c": "_",
                "d": 10,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 10,
                "c": "_",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 40,
                "c": "_",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 60,
                "c": "_",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2021",
                "b": 80,
                "c": "_",
                "d": 30,
                "e": "<"
              },
              {
                "a": "2022",
                "b": 40,
                "c": "_",
                "d": 40,
                "e": "<"
              },
              {
                "a": "2016",
                "b": 50,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2017",
                "b": 60,
                "c": "•",
                "d": 30,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 50,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 30,
                "c": "•",
                "d": 40,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 10,
                "c": "•",
                "d": 60,
                "e": "<"
              },
              {
                "a": "2021",
                "b": 10,
                "c": "•",
                "d": 60,
                "e": ">"
              },
              {
                "a": "2022",
                "b": 20,
                "c": "•",
                "d": 30,
                "e": ">"
              },
              {
                "a": "2016",
                "b": 70,
                "c": "+",
                "d": 50,
                "e": "<"
              },
              {
                "a": "2017",
                "b": 50,
                "c": "+",
                "d": 20,
                "e": "<"
              },
              {
                "a": "2018",
                "b": 40,
                "c": "+",
                "d": 10,
                "e": ">"
              },
              {
                "a": "2019",
                "b": 60,
                "c": "+",
                "d": 50,
                "e": ">"
              },
              {
                "a": "2020",
                "b": 30,
                "c": "+",
                "d": 20,
                "e": "<"
              },
              {
                "a": "2021",
                "b": 10,
                "c": "+",
                "d": 20,
                "e": ">"
              },
              {
                "a": "2022",
                "b": 20,
                "c": "+",
                "d": 50,
                "e": ">"
              }
            ]
          },
          "layer": [
            {
              "mark": {
                "type": "line"
              },
              "encoding": {
                "x": {
                  "field": "a",
                  "type": "temporal"
                },
                "y": {
                  "field": "b",
                  "type": "quantitative"
                },
                "color": {
                  "field": "e",
                  "type": "nominal",
                  "scale": {
                    "range": [
                      "red", 
                      "orange"
                    ]
                  }
                }
              }
            },
            {
              "mark": {
                "type": "bar"
              },
              "encoding": {
                "x": {
                  "field": "a",
                  "type": "temporal"
                },
                "y": {
                  "field": "d",
                  "type": "quantitative"
                },
                "color": {
                  "field": "c",
                  "type": "nominal",
                  "scale": {
                    "range": [
                      "yellow",
                      "green",
                      "blue"
                    ]
                  }
                }
              }
            }
          ]
        };
        const range = parseScales(layerPrimary(specification)).color.range();
        assert.equal(range.length, 5)

        const layers = [0, 1]
        const values = layers.map((index) => specification.layer[index].encoding.color.scale.range).flat()

        values.forEach((value) => {
          assert.ok(range.includes(value))
        });
      });

      test('multiple graphical layers', (assert) => {
        const specification = {
          data: {
            values: [
              { date: "2020", value: 14, otherValue: 66 },
              { date: "2021", value: 45, otherValue: 65 },
              { date: "2022", value: 22, otherValue: 66 },
              { date: "2023", value: 22, otherValue: 64 },
              { date: "2024", value: 23, otherValue: 62 },
              { date: "2025", value: 24, otherValue: 55 },
              { date: "2026", value: 26, otherValue: 57 },
              { date: "2027", value: 11, otherValue: 53 },
              { date: "2028", value: 24, otherValue: 44 },
            ]
          },
          layer: [
            {
              mark: {
                type: "line",
              },
              encoding: {
                x: {
                  field: 'date',
                  type: 'temporal'
                },
                y: {
                  field: 'value',
                  type: 'quantitative'
                }
              }
            },
            {
              mark: {
                type: "bar",
              },
              encoding: {
                x: {
                  field: "date",
                  type: "temporal",
                  axis: {
                    title: 'date'
                  },
                },
                y: {
                  field: "otherValue",
                  type: "quantitative",
                  axis: {
                    title: 'other value'
                  },
                },
              }
            }
          ]
        };
        assert.equal(layerPrimary(specification).mark.type, 'bar', 'selects layers with explicit axis configuration from charts with multiple graphical layers');
      });
    });


    test('calls a function for multiple layers', (assert) => {
      const s = {
        title: {
          text: 'layerCall() test specification'
        },
        data: {
          values: [
            { a: 1, b: 10 },
            { a: 2, b: 11 },
            { a: 3, b: 12 },
          ]
        },
        layer: [
          {
            mark: {
              type: 'point'
            },
            encoding: {
              x: {
                field: 'a',
                type: 'quantitative'
              },
              y: {
                field: 'b',
                type: 'quantitative'
              }
            }
          },
          {
            mark: {
              type: 'text'
            },
            encoding: {
              x: {
                field: 'a',
                type: 'quantitative'
              },
              y: {
                field: 'b',
                type: 'quantitative'
              },
              text: {
                field: 'b'
              }
            }
          }
        ]
      }
      const results = {};
      const track = (s) => {
        return () => {
          results[s.mark.type] = true;
        };
      };
      const element = document.createElement('div');
      d3.select(element).call(layerCall(s, track));
      assert.ok(results.point);
      assert.ok(results.text);
    });
  });
});
