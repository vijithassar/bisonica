import * as d3 from 'd3';

import { mark, noop, values } from './helpers.js';
import { markSelector, marks } from './marks.js';
import { parseScales } from './scales.js';

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
 * compute a unified data domain across all layers
 * @param {object} s Vega Lite specification
 * @param {string} channel visual encoding
 * @returns {array} unified domain
 */
const unionDomains = (s, channel) => {
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

      return parseScales(layer, { x: 0, y: 0 })[channel];
    })
    .filter((item) => !!item);

  const domains = scales
    .map((item) => (typeof item.domain === 'function' ? item.domain() : null))
    .flat();

  const getType = (s) => s.encoding?.[channel].type;

  const type = getType(s) || getType(s.layer.find(getType));

  if (type === 'quantitative' || type === 'temporal' || !type) {
    return d3.extent(domains);
  } else if (type === 'nominal' || type === 'ordinal') {
    return [...new Set(domains).values()];
  }
};

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

  // clean up empty properties in layers with text content defined by the mark object
  if (layerSpecification.mark.type === 'text' && layerSpecification.mark.text) {
    const properties = ['data', 'encoding'];

    properties.forEach((property) => {
      if (Object.prototype.hasOwnProperty.call(layerSpecification, property)) {
        delete layerSpecification[property];
      }
    });
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
        selection
          .append('g')
          .classed('layer', true)
          .call(marks(layerSpecification(s, index), dimensions));
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

export { layer, layerMatch, layerNode, layerTestRecursive };
