import { chart } from '../../source/chart.js';
import { render } from '../test-helpers.js';
import qunit from 'qunit';

const { module, test } = qunit;

const specification = {
    title: {
        text: "this specification will cause an error"
    },
    encoding: {},
    mark: {}
};

module('unit > error handling', () => {
    test('catches errors by default', (assert) => {
        render(specification);
        assert.ok(true);
    });
    test('uses custom error handlers', (assert) => {
        let x = null;
        const handler = (error) => x = error;
        const renderer = chart(specification).error(handler);
        renderer();
        assert.ok(x instanceof Error);
    });
    test('disables error handling', (assert) => {
        assert.throws(() => chart(specification).error(null));
    });
});