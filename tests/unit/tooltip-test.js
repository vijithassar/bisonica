import { module, test } from 'qunit';
import { tooltipContent } from '../../source/tooltips';

module('Unit | Component | falcon-charts | tooltips', () => {
  test('it is a function factory', (assert) => {
    assert.equal(typeof tooltipContent({}), 'function');
  });

  const values = [
    { a: 1, b: 2, c: 3, group: 'a' },
    { a: 1, b: 2, c: 3, group: 'b' },
  ];

  const encoding = { x: { field: 'a' }, y: { field: 'b' }, color: { field: 'group' } };

  test('includes encoding fields by default', (assert) => {
    const s = {
      data: { values },
      mark: { tooltip: true },
      encoding,
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.ok(text.includes('a: 1'));
    assert.ok(text.includes('b: 2'));
    assert.ok(text.includes('group: a'));
  });
  test('does not include unused fields by default', (assert) => {
    const s = {
      data: { values },
      mark: { tooltip: true },
      encoding,
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.ok(!text.includes('c:'));
  });
  test('can include all data fields', (assert) => {
    const s = {
      data: { values },
      mark: { tooltip: { content: 'data' } },
      encoding,
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.ok(text.includes('a: 1'));
    assert.ok(text.includes('b: 2'));
    assert.ok(text.includes('c: 3'));
    assert.ok(text.includes('group: a'));
  });
  test('can specify a data field', (assert) => {
    const s = {
      data: { values },
      mark: { type: null, tooltip: true },
      encoding: {
        ...encoding,
        tooltip: { field: 'a' },
      },
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.equal(text, '1');
  });
  test('can specify multiple data fields', (assert) => {
    const s = {
      data: { values },
      mark: { type: null, tooltip: true },
      encoding: {
        ...encoding,
        tooltip: [
          { field: 'a', type: 'quantitative' },
          { field: 'b', type: 'quantitative' },
        ],
      },
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.equal(text, 'a: 1; b: 2');
  });
  test('can specify labels', (assert) => {
    const s = {
      data: { values },
      mark: { type: null, tooltip: true },
      encoding: {
        ...encoding,
        tooltip: [
          { field: 'a', type: 'quantitative', label: 'VALUE OF A' },
          { field: 'b', type: 'quantitative', label: 'VALUE OF B' },
        ],
      },
    };
    const text = tooltipContent(s)(s.data.values[0]);

    assert.equal(text, 'VALUE OF A: 1; VALUE OF B: 2');
  });
  test('can specify a calculate transform field', (assert) => {
    const datum = { a: '1' };
    const transformField = {
      mark: { type: null, tooltip: true },
      transform: [{ calculate: "'tooltip value is: ' + datum.a", as: 'd' }],
      encoding: {
        ...encoding,
        tooltip: { field: 'd' },
      },
    };
    const text = tooltipContent(transformField)(datum);

    assert.equal(text, 'tooltip value is: 1');
  });
});
