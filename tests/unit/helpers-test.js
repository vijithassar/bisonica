import * as helpers from '../../source/helpers.js';
import qunit from 'qunit';

const { module, test } = qunit;

module('unit > helpers', () => {
  test('extracts values from s', (assert) => {
    const value = {};
    const s = { data: { values: [value] } };

    assert.equal(helpers.values(s).pop(), value);
  });
  test('converts polar coordinates to cartesian coordinates', (assert) => {
    const radius = 10;
    const right = helpers.polarToCartesian(radius, 0);
    const up = helpers.polarToCartesian(radius, Math.PI * 0.5);
    const left = helpers.polarToCartesian(radius, Math.PI);
    const down = helpers.polarToCartesian(radius, Math.PI * 1.5);
    const loop = helpers.polarToCartesian(radius, Math.PI * 2);

    assert.equal(right.x, radius);
    assert.equal(up.y, radius);
    assert.equal(left.x, radius * -1);
    assert.equal(down.y, radius * -1);
    assert.equal(loop.x, right.x);
  });
});
