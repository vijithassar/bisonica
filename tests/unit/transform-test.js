import {
  calculate,
  transform,
} from '@crowdstrike/falcon-charts/components/falcon-charts/shared/transform';
import { encodingValue } from '@crowdstrike/falcon-charts/components/falcon-charts/shared/encodings';
import { module, test } from 'qunit';

const expressions = {
  naive: "'https://www.crowdstrike.com' + '/' + 'test'",
  interpolate: "'https://www.crowdstrike.com' + '/' + datum.a",
  multiple: "'https://www.crowdstrike.com' + '/' + datum.a + datum.b",
};

module('Unit | Component | falcon-charts | transform', () => {
  module('transform', () => {
    test('requires a calculate transform', (assert) => {
      const s = { transform: [{ filter: null }] };

      assert.throws(() => transform(s)({}));
    });
    test('adds derived fields to a data point', (assert) => {
      const s = { transform: [{ calculate: expressions.naive, as: 'a' }] };

      assert.equal(transform(s)({}).a, 'https://www.crowdstrike.com/test');
    });
    test('runs multiple transforms', (assert) => {
      const datum = {
        a: 1,
        b: 2,
      };
      const s = {
        transform: [
          { calculate: expressions.naive, as: 'c' },
          { calculate: expressions.interpolate, as: 'd' },
          { calculate: expressions.multiple, as: 'e' },
        ],
      };

      assert.equal(transform(s)(datum).c, 'https://www.crowdstrike.com/test');
      assert.equal(transform(s)(datum).d, 'https://www.crowdstrike.com/1');
      assert.equal(transform(s)(datum).e, 'https://www.crowdstrike.com/12');
    });
    test('falls back to transform lookups', (assert) => {
      const s = {
        data: { values: [{ a: 1 }] },
        transform: [{ calculate: "'value: ' + datum.a", as: 'b' }],
        encoding: { x: { type: 'nominal', field: 'b' } },
      };

      assert.equal(encodingValue(s, 'x')(s.data.values[0]), 'value: 1');
    });
  });
  module('calculate', () => {
    test('is a function factory', (assert) => {
      assert.equal(typeof calculate, 'function');
      assert.equal(typeof calculate(expressions.naive), 'function');
    });
    test('requires a string input', (assert) => {
      assert.throws(() => calculate(0));
      assert.throws(() => calculate(null));
      assert.throws(() => calculate(undefined));
      assert.throws(() => calculate([]));
      assert.throws(() => calculate({}));
    });
    test('returns a string', (assert) => {
      assert.equal(calculate(expressions.naive)({}), 'https://www.crowdstrike.com/test');
    });
    test('interpolates properties', (assert) => {
      assert.equal(
        calculate(expressions.interpolate)({ a: 'test' }),
        'https://www.crowdstrike.com/test',
      );
    });
    test('interpolates multiple properties', (assert) => {
      assert.equal(
        calculate(expressions.multiple)({ a: '1', b: '2' }),
        'https://www.crowdstrike.com/12',
      );
    });
    test('omits malformed string interpolations', (assert) => {
      assert.equal(
        calculate("'https://www.crowdstrike.com' + '/' + datum.a + '/test")({ a: '1' }),
        'https://www.crowdstrike.com/1',
      );
    });
  });
});
