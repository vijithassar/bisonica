import { meta } from '@crowdstrike/falcon-charts/components/falcon-charts/chart/meta';
import { module, test } from 'qunit';
import { specificationFixture } from '@crowdstrike/falcon-charts/components/falcon-charts/test-helpers';

module('Unit | Component | falcon-charts | usermeta', () => {
  test('creates usermeta', (assert) => {
    const s = {};

    meta(s);
    assert.ok(s.usermeta);
  });
  test('serializes specifications', (assert) => {
    const s = specificationFixture('stackedBar');
    const serialized = JSON.stringify(s);

    assert.ok(serialized.includes(s.$schema));
  });
  test('prohibits arbitrary usermeta', (assert) => {
    const s = {};

    meta(s);
    assert.throws(() => (s.usermeta.someNewUnknownAttribute = true));
  });
});
