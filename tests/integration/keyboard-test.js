import {
  render,
  specificationFixture,
  tooltipContentUpdate,
} from '../test-helpers.js';
import qunit from 'qunit';

const { module, test } = qunit;

const LEFT = 'ArrowLeft';
const RIGHT = 'ArrowRight';

module('integration > keyboard', function () {

  test.skip('keyboard navigation works', async function (assert) {
    const dispatchEvents = {
      [LEFT]: new KeyboardEvent('keyup', {
        key: LEFT,
      }),
      [RIGHT]: new KeyboardEvent('keyup', {
        key: RIGHT,
      }),
    };
    const spec = specificationFixture('circular'); // eslint-disable-line

    await render(`
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
