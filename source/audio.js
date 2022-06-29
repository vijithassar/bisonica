import * as d3 from 'd3';
import { data } from './data.js';
import { dispatchers } from './interactions.js';
import { feature } from './feature.js';
import { markInteractionSelector } from './marks.js';
import { noop } from './helpers.js';

const context = new AudioContext();

const tuning = 440;
const root = tuning / 2;
const octaves = 2;
const tempo = 160;
const duration = 60 / tempo / 2;
const temperament = Math.pow(2, 1 / 12);

const chromatic = (root) => {
  return Array.from({ length: 13 }).map((step, index) => root * Math.pow(temperament, index));
};

const minorLinear = (min, max) => {
  const h = (max - min) / 12;
  const w = h * 2;
  const steps = [0, w, h, w, w, h, w, w];

  return steps.map((_, index) => {
    return d3.sum(steps.slice(0, index)) + min;
  });
};

const minorExponential = (root) => {
  const semitones = [0, 2, 3, 5, 7, 8, 10, 12];

  return chromatic(root).filter((_, index) => semitones.includes(index));
};

const note = (frequency, start) => {
  const oscillator = context.createOscillator();
  const gainNode = context.createGain();

  gainNode.gain.setValueAtTime(1.0, context.currentTime + start);

  const end = context.currentTime + start + duration;

  oscillator.connect(gainNode);
  gainNode.connect(context.destination);

  oscillator.frequency.value = frequency;

  gainNode.gain.setValueAtTime(context.currentTime + start * 0.8, 1);
  gainNode.gain.linearRampToValueAtTime(0.001, end);

  oscillator.start(context.currentTime + start);
  oscillator.stop(end);
};

const repeatLinear = (min, max) => {
  const spread = max - min;
  const slice = spread / octaves;

  return Array.from({ length: octaves })
    .map((_, index) => {
      const start = slice * index + min;
      const end = slice * (index + 1) + min;
      const steps = minorLinear(start, end).map((item) => item + start);

      return index === 0 ? steps : steps.slice(1);
    })
    .flat();
};

const repeatExponential = (min, max) => {
  if (max % min !== 0) {
    console.error('endpoints supplied for exponential scale repetition are not octaves');
  }

  return Array.from({ length: octaves })
    .map((_, index) => {
      const steps = minorExponential(min * 2 ** index);

      return index === 0 ? steps : steps.slice(1);
    })
    .flat();
};

const notes = (values, dispatcher) => {
  const extent = d3.extent(values, (d) => d.value);
  const domain = repeatLinear(...extent);
  const range = repeatExponential(root, root * 2 ** octaves);
  const scale = d3.scaleThreshold().domain(domain).range(range);

  const pitches = values.map(({ value }) => scale(value));

  pitches.forEach((pitch, index) => {
    note(pitch, index * duration);
    setTimeout(() => {
      dispatcher.call('focus', null, index);
    }, (index + 1) * duration * 1000);
  });
};

const audio = (specification) => {
  if (specification.layer) {
    return noop;
  }

  return (wrapper) => {
    const hasSingleCategory =
      new Set(specification.data.values.map((item) => item[specification.encoding.color?.field]))
        .size === 1;
    const playable =
      (hasSingleCategory && feature(specification).isLine()) ||
      (hasSingleCategory && feature(specification).isBar()) ||
      feature(specification).isCircular();

    let values;

    if (feature(specification).isLine()) {
      ({ values } = lineData(specification)[0]);
    } else if (feature(specification).isCircular()) {
      values = circularData(specification);
    } else if (feature(specification).isBar()) {
      values = stackedBarData(specification)[0].map((item) => {
        return { value: item.data.undefined?.value };
      });
    }

    if (!playable || !values) {
      return;
    }

    const dispatcher = dispatchers.get(wrapper.node());

    dispatcher.on('play', (values) => {
      notes(values, dispatcher);
    });

    dispatcher.on('focus', (index) => {
      wrapper.selectAll(markInteractionSelector(specification)).nodes()[index].focus();

      if (index === values.length - 1) {
        playing = false;
      }
    });

    const play = wrapper.append('div').classed('play', true).text('▶');
    let playing = false;

    play.on('click', () => {
      if (!playing) {
        dispatcher.call('play', null, values);
        playing = true;
      }
    });
  };
};

export { audio };
