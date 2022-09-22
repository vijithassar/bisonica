import bench from 'nanobench';
import { specificationFixture, render } from '../tests/test-helpers.js';

const fixtures = [
        'categoricalBar',
        'circular',
        'line',
        'scatterPlot',
        'stackedArea',
        'stackedBar',
        'temporalBar',
    ];

const count = 100;

fixtures.forEach(fixture => {
const specification = specificationFixture(fixture);
    bench(`${fixture} × ${count}`, (b) => {
        b.start();
        for (let i = 0; i < count; i++) {
                render(specification)
                }
        b.end();
    });
});
