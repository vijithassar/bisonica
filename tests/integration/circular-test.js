import qunit from 'qunit';
import { render, testSelector } from '../test-helpers.js';
import { specificationFixture } from '../test-helpers.js';

const { module, test } = qunit;

const JITTER_RATIO = 0.01;

const isCircular = (marks) => {
  const jitter = 10;
  const dimensions = marks.getBBox();

  return Math.abs(Math.round(dimensions.height) - Math.round(dimensions.width)) < jitter;
};

const outsideBoundaries = (node, point) => {
  const bounds = node.getBoundingClientRect();

  return (
    bounds.top > point.y ||
    bounds.bottom < point.y ||
    bounds.left > point.x ||
    bounds.right < point.x
  );
};

const nodeCenter = (node) => {
  const dimensions = node.getBoundingClientRect();

  return {
    x: dimensions.x + dimensions.width * 0.5,
    y: dimensions.y + dimensions.height * 0.5,
  };
};

const jitter = (point, node) => {
  const dimensions = node.getBoundingClientRect();
  const totalRange = {
    x: dimensions.width - dimensions.x,
    y: dimensions.height - dimensions.y,
  };
  const jitterRange = {
    x: totalRange.x * JITTER_RATIO,
    y: totalRange.y * JITTER_RATIO,
  };
  const direction = Math.random() > 0.5 ? 1 : -1;

  return {
    x: point.x + jitterRange.x * direction,
    y: point.y + jitterRange.y * direction,
  };
};

// tests whether the bounds overlap the center so this
// only works if every segment is smaller than 25%
const isDonut = (marks) => {
  const center = nodeCenter(marks);
  const mark = [...marks.querySelectorAll(testSelector('mark'))];

  return mark.every((mark) => outsideBoundaries(mark, center)) && isCircular(marks);
};

const isPie = (marks) => {
  const mark = [...marks.querySelectorAll(testSelector('mark'))];
  const points = Array.from({ length: 10 })
    .fill(nodeCenter(marks))
    .map((point) => jitter(point, marks));
  const contained = points.every((point) => {
    return mark.some((node) => outsideBoundaries(node, point) === false);
  });

  return isCircular(marks) && contained;
};

module('integration > circular', function () {
  test('renders a circular chart', async function (assert) {
    const spec = specificationFixture('circular');

    const element = render(spec);

    const markSelector = testSelector('mark');

    assert.ok(element.querySelector(markSelector));
    assert.equal(element.querySelector(markSelector).tagName, 'path');

    const marks = element.querySelector(testSelector('marks'));

    assert.ok(isCircular(marks), 'marks group has approximately equal height and width');

    const mark = [...marks.querySelectorAll(markSelector)];
    const colors = new Set(mark.map((item) => item.style.fill));

    assert.ok(mark.length === colors.size, 'every segment is a different color');
  });

  test('renders a pie chart', async function (assert) {
    const spec = specificationFixture('circular');

    spec.mark = 'arc';

    const element = render(spec);

    const mark = testSelector('mark');

    assert.ok(element.querySelector(mark));
    assert.equal(element.querySelector(mark).tagName, 'path');

    const marks = element.querySelector(testSelector('marks'));

    assert.ok(isPie(marks));
  });

  test.skip('renders a donut chart', async function (assert) {
    const donutChartSpec = {
      ...specificationFixture('circular'),
      mark: { type: 'arc', innerRadius: 50 },
      data: {
        // must have at least five segments to avoid
        // bounds overlapping the center of the chart
        values: [
          { group: 'a', value: 1 },
          { group: 'b', value: 1 },
          { group: 'c', value: 1 },
          { group: 'd', value: 1 },
          { group: 'e', value: 1 },
        ],
      },
    };

    const element = render(donutChartSpec);

    const marksSelector = testSelector('marks');
    const markSelector = testSelector('mark');

    assert.ok(element.querySelector(markSelector));
    assert.equal(element.querySelector(markSelector).tagName, 'path');

    const marks = element.querySelector(marksSelector);

    assert.ok(isDonut(marks));
  });
});
