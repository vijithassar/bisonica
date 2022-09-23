import { encodingField, encodingValue } from './encodings.js';
import { layerTestRecursive } from './views.js';
import { mark, values } from './helpers.js';
import { memoize } from './memoize.js';

// this is a mistake
// import { isPresent } from '@ember/utils';
const isPresent = (x) => x !== null;

const _feature = (s) => {
  const multicolorTest = (s) => {
    const colorValues = [
      ...(Array.from(new Set(values(s))) || [])
        .map(encodingValue(s, 'color'))
        .filter((item) => !!item),
    ];

    return s.encoding?.color && colorValues.length > 1;
  };

  const isMulticolor = layerTestRecursive(s, multicolorTest);

  const temporalTest = (s) => {
    return Object.values(s.encoding || {}).some((encoding) => encoding.type === 'temporal');
  };
  const isTemporal = layerTestRecursive(s, temporalTest);

  const tests = {
    isBar: (s) => mark(s) === 'bar',
    isLine: (s) => mark(s) === 'line',
    isArea: (s) => mark(s) === 'area',
    hasPoints: (s) => mark(s) === 'point' || s.mark?.point === true,
    hasLayers: (s) => !!s.layer,
    isCircular: (s) => mark(s) === 'arc',
    isRule: (s) => mark(s) === 'rule',
    isText: (s) => mark(s) === 'text',
    isAggregate: (s) => ['x', 'y'].some((channel) => s.encoding?.[channel]?.aggregate),
    hasColor: (s) => !!s.encoding?.color,
    hasLinks: (s) => !!encodingField(s, 'href'),
    hasData: (s) => !!s.data?.values.length,
    hasLegend: (s) => s.encoding?.color?.legend !== null,
    hasLegendTitle: (s) => isPresent(s.encoding?.color?.legend?.title),
    hasTransforms: (s) => Array.isArray(s.transform),
    hasAxisLabelsY: (s) => s.encoding?.y?.axis?.labels !== false,
    hasAxisLabelsX: (s) => s.encoding?.x?.axis?.labels !== false,
    hasAxisTitleX: (s) => s.encoding?.x?.axis?.title !== null,
    hasAxisTitleY: (s) => s.encoding?.y?.axis?.title !== null,
    isCartesian: (s) => s.encoding?.x && s.encoding?.y,
    isLinear: (s) => (s.encoding?.x && !s.encoding.y) || (s.encoding.y && !s.encoding.x),
    isRadial: (s) => s.encoding.theta,
    isTemporal: () => isTemporal,
    isMulticolor: () => isMulticolor,
    hasEncodingX: (s) => s.encoding?.x,
    hasEncodingY: (s) => s.encoding?.y,
    hasEncodingColor: (s) => s.encoding.color,
  };

  tests.hasAxis = (s) => tests.hasEncodingX(s) || tests.hasEncodingY(s);

  tests.isTemporalBar = (s) => tests.isBar(s) && isTemporal;

  const layerTests = {};

  Object.entries(tests).forEach(([key, test]) => {
    layerTests[key] = memoize(() => {
      return layerTestRecursive(s, test);
    });
  });

  return layerTests;
};

/**
 * use simple heuristics to determine features the chart type
 * @param {object} s Vega Lite specification
 * @returns {object} methods for boolean feature tests
 */
const feature = memoize(_feature);

export { feature };
