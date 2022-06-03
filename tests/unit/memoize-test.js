import { memoize } from '@crowdstrike/falcon-charts/components/falcon-charts/shared/memoize';
import { module, test } from 'qunit';

module('Unit | component | falcon-charts | memoize', () => {
  test('memoizes functions', (assert) => {
    const fn = (input) => {
      return Math.random() + input;
    };
    const memoized = memoize(fn);

    assert.equal(memoized(1), memoized(1));
    assert.notEqual(memoized(1), memoized(2));
    assert.equal(memoized(2), memoized(2));
  });

  test('memoizes functions with multiple arguments', (assert) => {
    const fn = (...inputs) => {
      return inputs.reduce((accumulator, current) => {
        return accumulator + current + Math.random();
      }, 0);
    };

    const memoized = memoize(fn);

    assert.equal(memoized(1, 2), memoized(1, 2));
    assert.notEqual(memoized(1, 2), memoized(2, 3));
    assert.equal(memoized(2, 3), memoized(2, 3));
  });
});
