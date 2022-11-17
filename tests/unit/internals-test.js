import { dimensions } from './support.js';
import qunit from 'qunit';
import { createAccessors } from '../../source/accessors.js';
import { parseScales } from '../../source/scales.js';
import { createEncoders } from '../../source/encodings.js';
import { data } from '../../source/data.js';
import { feature } from '../../source/feature.js';
import { marks } from '../../source/marks.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

const charts = [
    'categoricalBar',
    'circular',
    'dotPlot',
    'line',
    'multiline',
    'rules',
    'scatterPlot',
    'singleBar',
    'stackedArea',
    'temporalBar'
];

module('unit > internals', () => {
    test('feature()', (assert) => {
        charts.forEach(chart => assert.equal(typeof feature(specificationFixture(chart)), 'object', chart));
    });
    test('data()', (assert) => {
        charts.forEach(chart => assert.ok(Array.isArray(data(specificationFixture(chart))), chart));
    });
    test('createAccessors()', assert => {
        charts.forEach(chart => assert.equal(typeof createAccessors(specificationFixture(chart)), 'object', chart));
    });
    test('parseScales()', assert => {
        charts.forEach(chart => assert.equal(typeof parseScales(specificationFixture(chart)), 'object', chart));
    });
    test('createEncoders()', assert => {
        charts.forEach(chart => {
            assert.equal(typeof createEncoders(specificationFixture(chart), dimensions, createAccessors(specificationFixture(chart))), 'object', chart);
        });
    });
    test('marks()', assert => {
        charts.forEach(chart => assert.equal(typeof marks(specificationFixture(chart), dimensions), 'function', chart));
    });
});
