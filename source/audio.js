import * as d3 from 'd3';
import { lineData } from './data';
import { noop } from './helpers';

const audioDispatcher = d3.dispatch('play');

audioDispatcher.on('play', (values) => {
  return;
});

const audio = (specification) => {
  if (specification.layer) {
    return noop;
  }

  return (wrapper) => {
    const { values } = lineData(specification)[0];
    const hasSingleCategory =
      typeof specification.encoding.color?.field === 'undefined' ||
      new Set(values.map((item) => item[specification.encoding.color?.field])).size === 1;

    const isLineChart = specification.mark === 'line' || specification.mark.type === 'line';

    if (hasSingleCategory && isLineChart) {
      const play = wrapper.append('div').classed('play', true).text('play');

      play.on('click', () => {
        audioDispatcher.call('play', null, values);
      });
    }
  };
};

export { audio };
