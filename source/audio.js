import * as d3 from 'd3';
import { circularData, lineData, stackedBarData } from './data';
import { dispatchers } from './interactions';
import { feature } from './feature';
import { markInteractionSelector } from './marks';
import { noop } from './helpers';

const context = new AudioContext();

const tuning = 440;
const root = tuning / 2;
const octaves = 2;
const tempo = 160;
const duration = 60 / tempo / 2;

const minor = (min, max) => {
  const h = (max - min) / 12;
  const w = h * 2;
  const steps = [0, w, h, w, w, h, w, w];

  return steps.map((step, index) => d3.sum(steps.slice(0, index + 1)) + min);
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

      return minor(start, end);
    })
    .flat();
};

const repeatExponential = (min, max) => {
  if (max % min !== 0) {
    console.error('endpoints supplied for exponential scale repetition are not octaves');
  }

  return Array.from({ length: octaves })
    .map((_, index) => {
      const start = min * 2 ** index;
      const end = min * 2 ** (index + 1);

      return minor(start, end);
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
