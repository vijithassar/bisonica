import * as d3 from 'd3';
import { lineData } from './data';
import { noop } from './helpers';

const context = new AudioContext();

const root = 440;
const tuning = 0;
const tempo = 120;
const duration = 60 / tempo / 2;

const h = (root * 2) / 12;
const w = h * 2;

const minor = (root) => {
  return [0, w, h, w, w, h, w, w].map((step) => step + root + tuning);
};

const audioDispatcher = d3.dispatch('play');

const note = (frequency, start) => {
  const oscillator = context.createOscillator();
  const gain = context.createGain();

  oscillator.connect(gain);
  gain.connect(context.destination);

  oscillator.frequency.value = frequency;

  oscillator.start(context.currentTime + start);
  oscillator.stop(context.currentTime + start + duration * 0.8);
};

const notes = (values) => {
  const scale = d3
    .scaleQuantize()
    .domain(d3.extent(values, (d) => d.value))
    .range(minor(root));

  const pitches = values.map(({ value }) => scale(value));

  pitches.forEach((pitch, index) => {
    note(pitch, index * duration);
  });
};

audioDispatcher.on('play', (values) => {
  notes(values);
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
