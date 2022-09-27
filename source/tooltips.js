import * as d3 from 'd3';

import { category } from './marks.js';
import { createAccessors } from './accessors.js';
import { encodingChannelQuantitative, encodingField, encodingType, encodingValue } from './encodings.js';
import { feature } from './feature.js';
import { getTimeFormatter } from './time.js';
import { memoize } from './memoize.js';
import { noop } from './helpers.js';
import { parseScales } from './scales.js';
import { transform } from './transform.js';

/**
 * format field description
 * @param {object} field key and value pair
 * @returns {string} field description
 */
const formatField = (field) => {
  return `${field.key}: ${field.value}`;
};

/**
 * format datum description
 * @param {array} content data fields to format
 * @returns {string} datum description
 */
const formatTooltipContent = (content) => {
  if (Array.isArray(content)) {
    return content.map(formatField).join('; ');
  } else {
    return content;
  }
};

const _includedChannels = (s) => {
  const excluded = ['tooltip', 'href', 'text', 'description'];

  if (!feature(s).isMulticolor()) {
    excluded.push('color');
  }

  return Object.keys(s.encoding).filter((channel) => excluded.includes(channel) === false);
};

/**
 * determine which encoding channels to include in a description
 * @param {object} s Vega Lite specification
 * @returns {array} included channels
 */
const includedChannels = memoize(_includedChannels);

/**
 * dispatch a CustomEvent with a data point
 * @param {object} s Vega Lite specification
 * @param {object} node mark DOM node
 * @param {object} interaction event
 */
function tooltipEvent(s, node, interaction) {
  try {
    const datum = d3.select(node).datum();

    if (!datum) {
      return;
    }

    const detail = { datum, node, interaction, content: tooltipContentData(s)(datum) };

    if (feature(s).isMulticolor()) {
      detail.color = parseScales(s).color(category.get(datum));
    }

    const customEvent = new CustomEvent('tooltip', {
      bubbles: true,
      detail,
    });

    node.dispatchEvent(customEvent);
  } catch (error) {
    throw new Error(`could not emit tooltip event - ${error.message}`);
  }
}

/**
 * render a tooltip
 * @param {object} selection D3 selection with a mark
 */
const tooltip = (selection, s) => {
  if (!s.mark.tooltip || s.encoding.tooltip === null) {
    return noop;
  }

  selection.append('title').text(tooltipContent(s)(selection.datum()));
};

/**
 * create a function to render all tooltips
 * @param {object} s Vega Lite specification
 * @returns {function} tooltip rendering function
 */
const tooltips = (s) => {
  return (selection) => {
    selection.each(function () {
      if (!s.usermeta?.tooltipHandler) {
        tooltip(d3.select(this), s);
      }
    });
  };
};

/**
 * create a function to retrieve a tooltip field pair from a datum
 * @param {object} s Vega Lite specification
 * @param {string} type encoding parameter, field, or transform field
 * @returns {function} function
 */
const _getTooltipField = (s, type) => {
  let accessors;

  const channel = type;

  accessors = createAccessors(s);

  // report length instead of start position as tooltip value for stacks
  if (feature(s).isBar() || feature(s).isArea()) {
    accessors[encodingChannelQuantitative(s)] = accessors.length;
  }

  let key;

  key = encodingField(s, channel);

  const getValue = accessors?.[channel] ? accessors[channel] : encodingValue(s, channel);

  return (d) => {
    let value;

    value = getValue(d);

    if (channel === 'color' && typeof value === 'undefined') {
      value = category.get(d);
    }

    if (encodingType(s, channel) === 'temporal') {
      value = getTimeFormatter(s, channel)(value);
    }

    if (!key && !value) {
      key = type; // key may be a field, not a channel
      value = transform(s)()(d)[key];
    }

    return { key, value };
  };
};
const getTooltipField = memoize(_getTooltipField);

const _tooltipContentDefault = (s) => {
  return (d) => {
    return includedChannels(s).map((channel) => getTooltipField(s, channel)(d));
  };
};
/**
 * retrieve default fields for tooltip
 * @param {object} s Vega Lite specification
 * @param {object} d datum
 * @returns {array} default field content
 */
const tooltipContentDefault = memoize(_tooltipContentDefault);

const _tooltipContentAll = (s) => {
  return (d) => {
    const encodings = tooltipContentDefault(s)(d);
    const encodingFields = new Set(encodings.map((item) => item.key));
    const properties = Object.keys(d);
    const metadataProperties = properties.filter((property) => !encodingFields.has(property));
    const metadata = metadataProperties.map((property) => {
      return { key: property, value: d[property] };
    });

    return [...encodings, ...metadata];
  };
};
/**
 * retrieve all datum fields for tooltip
 * @param {object} s Vega Lite specification
 * @param {object} d datum
 * @returns {array} all field content
 */
const tooltipContentAll = memoize(_tooltipContentAll);

/**
 * create a function to retrieve tooltip content
 * @param {object} s Vega Lite specification
 * @returns {function} tooltip field data lookup function
 */
const tooltipContentData = (s) => {
  return (d) => {
    if (!Object.keys(d).length || !s.mark.tooltip) {
      return;
    }

    const single = encodingField(s, 'tooltip') && !Array.isArray(s.encoding.tooltip);
    const multiple = Array.isArray(s.encoding.tooltip);
    const all = s.mark.tooltip?.content === 'data';

    if (all) {
      return tooltipContentAll(s)(d);
    } else if (single) {
      return getTooltipField(s, 'tooltip')(d).value;
    } else if (multiple) {
      return s.encoding.tooltip.map((fieldDefinition) => {
        const field = getTooltipField(s, fieldDefinition.field)(d);

        if (fieldDefinition.label) {
          field.key = fieldDefinition.label;
        }

        return field;
      });
    } else {
      return tooltipContentDefault(s)(d);
    }
  };
};

/**
 * create a function to render tooltip content
 * @param {object} s Vega Lite specification
 * @returns {function} tooltip content renderer
 */
const tooltipContent = (s) => {
  return (d) => {
    return formatTooltipContent(tooltipContentData(s)(d));
  };
};

export { tooltips, tooltipEvent, tooltipContent, tooltipContentData };
