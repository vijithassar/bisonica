import * as d3 from 'd3';
import { feature } from './feature.js';

import { mark, noop, values } from './helpers.js';
import { markSelector, marks } from './marks.js';
import { memoize } from './memoize.js';
import { parseScales } from './scales.js';
import { temporalBarDimensions } from './time.js';

/**
 * determine whether encoding types can be shared
 * across layers
 * @param {object} s Vega Lite specification
 * @param {string} channel encoding parameter
 * @returns {string} encoding type
 */
const unionEncodingTypes = (s, channel) => {
  const types = s.layer.map((layer) => layer.encoding?.[channel]?.type).filter((type) => !!type);

  if (new Set(types).size === 1) {
    return types.pop();
  }
};

/**
 * determine whether a data set is empty
 * @param {object} data data set
 * @returns {boolean} empty
 */
const emptyData = (data) => {
  if (!data) {
    return true;
  }

  return data.some((item) => Object.keys(item).length) === false;
};

/**
 * compute a unified set of scale values across all layers
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @param {'domain'|'range'} valueType value type
 * @returns {array} unified set of scale values
 */
const unionScaleValues = (s, channel, valueType) => {
  const layers = s.layer;
  const layersWithData = layers
    .map((layer) => {
      const data = !layer.data || emptyData(values(layer)) ? s.data : layer.data;

      return { ...layer, data };
    })
    .filter((layer) => layer.data);
  const scales = layersWithData
    .map((layer) => {
      const encoding = layer.encoding?.[channel];

      if (!encoding) {
        return null;
      }

      const addType = encoding && !encoding.type && !encoding.value;

      if (addType) {
        const unionedType = unionEncodingTypes(s, channel);

        if (unionedType) {
          layer.encoding[channel].type = unionedType;
        }
      }

      return parseScales(layer)[channel];
    })
    .filter((item) => !!item);

  const scaleValues = scales
    .map((item) => (typeof item[valueType] === 'function' ? item[valueType]() : null))
    .flat();

  const getType = (s) => s.encoding?.[channel]?.type;

  const type = getType(s) || getType(s.layer.find(getType));

  if (type === 'quantitative' || type === 'temporal' || !type) {
    return d3.extent(scaleValues);
  } else if (type === 'nominal' || type === 'ordinal') {
    return [...new Set(scaleValues).values()];
  }
};

/**
 * compute a unified data domain across all layers
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @returns {array} unified domain
 */
const unionDomains = (s, channel) => unionScaleValues(s, channel, 'domain');

/**
 * compute a unified data range across all layers
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @returns {array} unified range
 */
const unionRanges = (s, channel) => unionScaleValues(s, channel, 'range');

/**
 * test all layers with a predicate function
 * @param {object} s Vega Lite specification
 * @param {function} test predicate function
 * @returns {boolean} recursive test result
 */
const layerTest = (s, test) => {
  if (!s.layer) {
    return false;
  }

  return s.layer.some((_, index) => {
    return test(layerSpecification(s, index));
  });
};

/**
 * find the first root level or layer level specification
 * which matches a predicate function return it
 * @param {object} s Vega Lite specification
 * @param {function} test predicate function
 * @returns {object} Vega Lite specification for a single layer
 */
const layerMatch = (s, test) => {
  if (!s.layer && test(s)) {
    return s;
  } else if (s.layer) {
    const layers = s.layer.map((layer, index) => layerSpecification(s, index));
    const index = layers.findIndex(test);

    if (index !== -1) {
      return layerSpecification(s, index);
    }
  }
};

/**
 * select the layer that is likely to be the most important
 * for global functionality like axes and margins across the
 * entire chart
 * @param {object} s Vega Lite specification
 * @returns {object} layer specification
 */
const _layerPrimary = (s) => {
  if (!s.layer) {
    return s;
  }
  const heuristics = [
    // explicit axis configuration
    (s) => s.encoding.x?.axis || s.encoding.y?.axis,
    // radial
    (s) => s.encoding.theta && s.encoding.color,
    // cartesian
    (s) => s.encoding.x && s.encoding.y,
    // linear
    (s) => s.encoding.x && !s.encoding.y || !s.encoding.x && s.encoding.y,
  ]
  // add a wrapper to require encoding
  .map((heuristic) => (s) => s.encoding && heuristic(s))
  // add a wrapper to prohibit static text marks
  .map((heuristic) => (s) => !feature(s).hasStaticText() && heuristic(s));

  for (const heuristic of heuristics) {
    let match = layerMatch(s, heuristic);
    if (typeof match === 'object') {
      if (feature(s).hasColor() && !match.encoding.color?.scale?.domain) {
        if (!match.encoding.color) {
          match.encoding.color = {};
        }
        if (!match.encoding.color.scale) {
          match.encoding.color.scale = {};
        }
        const domain = unionDomains(s, 'color');
        const range = unionRanges(s, 'color');
        match.encoding.color.scale = { domain }
        if (range.length === domain.length) {
          match.encoding.color.scale.range = range;
        }
      }
      return match;
    }
  }
};
const layerPrimary = memoize(_layerPrimary);

/**
 * find the DOM element corresponding to a layer
 * specification
 * @param {object} s Vega Lite layer specification
 * @param {object} wrapper chart wrapper node
 * @returns {object} DOM element
 */
const layerNode = (s, wrapper) => {
  const layers = d3.select(wrapper).selectAll('g.layer');
  const match = layers.filter(function () {
    return !!d3.select(this).selectAll(markSelector(s)).size();
  });

  if (match.size()) {
    return match.node();
  } else if (!s.layer) {
    return wrapper;
  }
};

/**
 * construct a specification equivalent to a
 * single layer of a multilayer specification
 * @param {object} s Vega Lite specification
 * @param {number} index index of the target layer
 * @returns {object} Vega Lite specification for a single layer
 */
const layerSpecification = (s, index) => {
  if (typeof index === 'undefined') {
    throw new Error(`layer ${index} in specification is undefined`);
  }

  const layer = s.layer[index];

  if (!layer) {
    return;
  }

  if (layer.layer) {
    throw new Error(
      `layer at index ${index} has a layer property, but nested layers are not supported`,
    );
  }

  const layerSpecification = {
    ...s,
    ...layer,
  };

  // clean up layers with text content defined by the mark object
  if (layerSpecification.mark.type === 'text' && layerSpecification.mark.text) {
    delete layerSpecification.data;
  }

  Object.entries(layerSpecification.encoding || {}).forEach(([channel, definition]) => {
    if (!definition.type) {
      const type = unionEncodingTypes(s, channel);

      if (type) {
        layerSpecification.encoding[channel].type = type;
      }
    }

    if (['x', 'y'].includes(channel)) {
      if (!layerSpecification.encoding) {
        layerSpecification.encoding = {};
      }

      if (!layerSpecification.encoding[channel]) {
        layerSpecification.encoding[channel] = {};
      }

      if (!layerSpecification.encoding[channel].scale) {
        layerSpecification.encoding[channel].scale = {};
      }

      if (!layerSpecification.encoding[channel]?.scale?.domain) {
        layerSpecification.encoding[channel].scale = {
          domain: unionDomains(s, channel),
        };
      }
    }
  });

  const prohibited = ['layer', '$schema', 'title', 'description'];

  prohibited.forEach((key) => {
    delete layerSpecification[key];
  });

  return layerSpecification;
};

/**
 * render layers of a specification
 * @param {object} s Vega Lite specification
 * @param {object} dimensions chart dimensions
 * @returns {function} layer renderer
 */
const layer = (s, dimensions) => {
  if (!s.layer.length) {
    return noop;
  }

  return (selection) => {
    s.layer.forEach((_, index) => {
      try {
        const layer = layerSpecification(s, index);
        const barLayer = layerSpecification(s, s.layer.findIndex((layer) => feature(layer).isBar()))
        const changeDimensions = feature(s).isTemporalBar() && !feature(layer).isTemporalBar()
        selection
          .append('g')
          .classed('layer', true)
          .call(marks(layer, changeDimensions ? temporalBarDimensions(barLayer, dimensions) : dimensions));
      } catch (error) {
        const markName = mark(layerSpecification(s, index));

        error.message = `could not render ${markName} mark layer at index ${index} - ${error.message}`;
        throw error;
      }
    });
  };
};

/**
 * recursively test a predicate function on root
 * level specification and any layers it contains
 * @param {object} s Vega Lite specification
 * @param {function} test predicate function
 * @returns {boolean} recursive test result
 */
const layerTestRecursive = (s, test) => {
  return test(s) || layerTest(s, test);
};

/**
 * run a function with selection.call() across multiple layers
 * @param {object} s Vega Lite specification
 * @returns {function(object)}
 */
const layerCall = (s, fn) => {
  const layers = s.layer ? s.layer.map((_, index) => layerSpecification(s, index)) : [s];
  if (!layers.length) {
    throw new Error(`could not determine layers for calling function ${fn.name}`);
  }
  return (selection) => {
    layers.forEach((layer, index) => {
      try {
        selection.call(fn(layer));
      } catch (error) {
        error.message = `function ${fn.name} does not return a function for layer ${index}`;
        throw new Error(error);
      }
    });
  };
}

export { layer, layerMatch, layerPrimary, layerNode, layerTestRecursive, layerSpecification, layerCall };
