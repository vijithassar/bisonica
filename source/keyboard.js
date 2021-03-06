import * as d3 from 'd3';

import { category, markInteractionSelector } from './marks.js';
import { dispatchers } from './interactions.js';
import { feature } from './feature.js';
import { getUrl, mark, noop } from './helpers.js';
import { layerMatch, layerNode } from './views.js';

const UP = 'up';
const RIGHT = 'right';
const DOWN = 'down';
const LEFT = 'left';

const series = {
  match(node, mark, state) {
    return category.get(mark.nodes()[state.index()]) === category.get(node);
  },
  later(node, mark, state) {
    const index = [...mark.nodes()].indexOf(node);

    return (
      category.get(mark.nodes()[index]) !== category.get(mark.nodes()[state.index()]) &&
      index > state.index()
    );
  },
  earlier(node, mark, state) {
    const index = [...mark.nodes()].indexOf(node);

    return (
      category.get(mark.nodes()[index]) !== category.get(mark.nodes()[state.index()]) &&
      index < state.index()
    );
  },
};

const x = {
  position(node) {
    return Math.round(node.getBoundingClientRect().left);
  },
  match(node, mark, state) {
    return this.position(node) === this.position(mark.nodes()[state.index()]);
  },
};

/**
 * generate a listener for an arrow key
 * @param {object} s Vega Lite specification
 * @param {('up'|'right'|'down'|'left')} direction arrow direction
 * @returns {function} key listener
 */
const key = (s, direction) => {
  return (mark, state) => {
    const dispatcher = dispatchers.get(mark.node());

    let min = 0;
    let max = mark.nodes().length - 1;
    const current = () => mark.nodes()[state.index()];

    const isEmpty = (node) => {
      if (feature(s).isBar()) {
        return (
          isNaN(d3.select(node).datum()[1]) ||
          d3.select(node).datum()[1] - d3.select(node).datum()[0] === 0
        );
      }

      return false;
    };

    if (typeof state.index() === 'undefined') {
      state.init();
      dispatcher.call('addMarkHighlight', current());
      dispatcher.call('addLegendHighlight', null, category.get(current()));

      return;
    }

    dispatcher.call('removeMarkHighlight', current());
    dispatcher.call('removeLegendHighlight', null, current());

    let step;
    let cycle;

    if (feature(s).isCartesian()) {
      if (direction === RIGHT) {
        step = (node, index) => {
          return series.match(node, mark, state) && index > state.index() && !isEmpty(node);
        };

        cycle = (node) => series.match(node, mark, state) && !isEmpty(node);
      }

      if (direction === LEFT) {
        const row = [...mark.nodes()].filter(
          (node) => series.match(node, mark, state) && !isEmpty(node),
        );

        step = (node) => {
          return node === row[row.indexOf(current()) - 1];
        };

        cycle = (node) => {
          return node === row[row.length - 1];
        };
      }

      if (direction === UP) {
        step = (node) =>
          series.later(node, mark, state) && x.match(node, mark, state) && !isEmpty(node);
        cycle = (node) =>
          series.earlier(node, mark, state) && x.match(node, mark, state) && !isEmpty(node);
      }

      if (direction === DOWN) {
        const column = [...mark.nodes()].filter((node) => {
          return x.match(node, mark, state) && !isEmpty(node);
        });

        step = (node) => node === column[column.indexOf(current()) - 1];

        cycle = (node) => node === column[column.length - 1];
      }
    }

    if (feature(s).isCircular()) {
      if (direction === RIGHT) {
        step = (node, index) => index === state.index() + 1;
        cycle = (node, index) => index === min;
      }

      if (direction === LEFT) {
        step = (node, index) => index === state.index() - 1;
        cycle = (node, index) => index === max;
      }
    }

    let next;

    const nextStep = [...mark.nodes()].findIndex(step);
    const nextCycle = [...mark.nodes()].findIndex(cycle);

    if (nextStep !== -1) {
      next = nextStep;
    } else if (nextCycle !== -1) {
      next = nextCycle;
    }

    if (typeof next === 'number') {
      mark.attr('tabindex', -1);
      state.index(next);
      d3.select(current()).attr('tabindex', 0);
      current().focus();
      dispatcher.call('addMarkHighlight', current());
      dispatcher.call('addLegendHighlight', null, category.get(current()));
    }
  };
};

/**
 * store current keyboard navigation position in a closure
 * @returns {object} methods for modifying keyboard position state
 */
const createState = () => {
  let index;

  return {
    init() {
      if (typeof index === 'undefined') {
        index = 0;
      }
    },
    index(n) {
      return typeof n === 'undefined' ? index : ((index = n), true);
    },
  };
};

/**
 * prevent page from scrolling
 * @returns {object} key event
 */
const stopScroll = (event) => {
  if (event.key !== 'Tab') {
    event.preventDefault();
  }
};

/**
 * convert a key name into a simpler and shorter handle
 * @param {string} key key name from the event
 * @returns {('up'|'right'|'down'|'left')} shorter key name
 */
const keyMap = (key) => {
  const map = {
    ArrowUp: UP,
    ArrowRight: RIGHT,
    ArrowDown: DOWN,
    ArrowLeft: LEFT,
  };

  return map[key];
};

/**
 * attach keyboard navigation to a chart DOM
 * @param {object} _s Vega Lite specification
 * @returns {function}
 */
const keyboard = (_s) => {
  try {

    const keyboardTest = (s) => !feature(s).isRule() && !feature(s).isText();
    const s = layerMatch(_s, keyboardTest);

    const exit =
      !s || // no specification
      !mark(s) || // no mark
      feature(s).isRule() || // rule mark
      feature(s).isText() || // text marks
      (!feature(s).isLine() && feature(s).hasPoints()) || // points with no line
      (feature(s).isLine() && !feature(s).hasPoints()); // line with no points

    if (exit) {
      return noop;
    }

    const navigation = (wrapper) => {
      let navigator = {};

      navigator[LEFT] = key(s, LEFT);
      navigator[RIGHT] = key(s, RIGHT);

      if (feature(s).isMulticolor() && feature(s).isCartesian()) {
        navigator[UP] = key(s, UP);
        navigator[DOWN] = key(s, DOWN);
      }

      const mark = d3.select(layerNode(s, wrapper.node())).selectAll(markInteractionSelector(s));

      const state = createState();
      const dispatcher = dispatchers.get(mark.node());

      const first = mark.filter((d, i) => i === 0);

      first.attr('tabindex', 0);

      // fire navigation initialization behaviors on first focus

      mark.on('focus', function (event) {
        if (typeof state.index() === 'undefined') {
          navigator[RIGHT](mark, state);
        }

        dispatcher.call('tooltip', this, event);
      });

      mark.on('keydown', (event) => {
        stopScroll(event);

        if (event.key === 'Enter') {
          const node = mark.nodes()[state.index()];
          const d = d3.select(node).datum();
          const url = getUrl(s, d);

          if (url) {
            dispatcher.call('link', node, url);
          }
        }
      });
      mark.on('keyup', (event) => {
        stopScroll(event);

        const move = navigator[keyMap(event.key)];

        if (typeof move === 'function') {
          move(mark, state);
          dispatcher.call('tooltip', mark.nodes()[state.index()], event);
        }
      });
    };

    return navigation;
  } catch (error) {
    throw new Error(`keyboard navigation failure - ${error.message}`);
  }
};

export { keyboard };
