import {
  layerMatch,
  layerNode,
} from '../../source/views.js';
import qunit from 'qunit';

const { module, test } = qunit;

module('Unit | Component | falcon-charts | views', () => {
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
});
