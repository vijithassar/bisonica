import hbs from 'htmlbars-inline-precompile';
import { LEFT, RIGHT } from 'key-codes';
import { create } from 'ember-cli-page-object';
import {
  falconChartsDefinition,
  specificationFixture,
  tooltipContentUpdate,
} from '../test-helpers.js';
import { module, test } from 'qunit';
import { render } from '@ember/test-helpers';
import { setupRenderingTest } from 'ember-qunit';

module('Integration | Component | falcon-charts | keyboard', function (hooks) {
  setupRenderingTest(hooks);

  test('keyboard navigation works', async function (assert) {
    const dispatchEvents = {
      [LEFT]: new KeyboardEvent('keyup', {
        key: LEFT,
      }),
      [RIGHT]: new KeyboardEvent('keyup', {
        key: RIGHT,
      }),
    };
    const spec = specificationFixture('circular');

    this.page = create(falconChartsDefinition());

    this.set('spec', spec);
    await render(hbs`
      <FalconCharts::Chart
        @spec={{this.spec}}
        @height=500
        @width=1000
      />
      <div data-falcon-portal="tooltip"></div>
    `);

    const steps = [
      { key: RIGHT, content: 'value 167\ngroup Custom Intelligence' },
      { key: RIGHT, content: 'value 29\ngroup falcon-intel' },
      { key: RIGHT, content: 'value 20\ngroup defense-evasion' },
      { key: LEFT, content: 'value 29\ngroup falcon-intel' },
      { key: RIGHT, content: 'value 20\ngroup defense-evasion' },
    ];

    const assertions = steps.length;

    assert.expect(assertions);

    for (let { key, content } of steps) {
      this.page.mark()[0].dispatchEvent(dispatchEvents[key]);

      // eslint-disable-next-line no-await-in-loop
      const toolTipText = await tooltipContentUpdate(this.element);

      assert.ok(content === toolTipText, `'Tooltip text, ${toolTipText}, should match ${content}`);
    }
  });
});
