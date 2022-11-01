import * as d3 from 'd3';

import {
  encodingChannelQuantitative,
  encodingChannelCovariate,
  encodingChannelCovariateCartesian,
  encodingField,
  encodingValue,
} from './encodings.js';
import { metadata } from './metadata.js';
import { feature } from './feature.js';
import { identity, missingSeries, nested, values } from './helpers.js';
import { memoize } from './memoize.js';
import { parseTime } from './time.js';

/**
 * nest data points in a hierarchy according to property name
 * @param {array} data individual data points
 * @param {string} property property name under which to nest
 * @returns {array} nested data points
 */
const groupByProperty = (data, property) => {
  return Array.from(d3.group(data, (d) => d[property])).map(([key, values]) => ({ key, values }));
};

/**
 * compute totals for a set of grouped values
 * @param {object} datum grouped values
 * @param {string} property categorical property to sum on each datum
 * @param {string} valueKey property containing numerical value to sum
 * @returns {object} sum for property
 */
const sumByProperty = (datum, property, valueKey) => {
  const result = {};

  result.key = datum.key;
  datum.values.forEach((item) => {
    const key = item[property];

    if (typeof result[key] === 'undefined') {
      result[key] = { value: 0 };
    }

    const value = valueKey && valueKey.includes('.') ? nested(item, valueKey) : item[valueKey];

    result[key].value += value;

    // this should be refactored
    const field = ['url', 'description', 'tooltip'];

    field.forEach((field) => {
      if (item[field]) {
        result[key][field] = item[field];
      }
    });
  });

  return result;
};

/**
 * sum individual values into totals by group
 * @param {array} values individual data points
 * @param {string} groupBy property to group by
 * @param {string} sumBy property to sum by
 * @param {string} valueKey property to sum
 * @returns {array} nested group sums
 */
const groupAndSumByProperties = (values, groupBy, sumBy, valueKey) => {
  return groupByProperty(values, groupBy).map((item) => sumByProperty(item, sumBy, valueKey));
};

/**
 * string keys used to compute stack layout
 * @param {array} data data set
 * @returns {array} keys
 */
const stackKeys = (data) => {
  const keys = data
    .map((item) => {
      return Object.keys(item).filter((item) => item !== 'key');
    })
    .flat();
  const unique = [...new Set(keys)];

  return unique;
};

/**
 * sum values across the time period specified on the x axis
 * @param {object} s Vega Lite specification
 * @returns {array} values summed across time period
 */
const sumByCovariates = (s) => {
  const quantitative = encodingField(s, encodingChannelQuantitative(s));
  const covariate = encodingField(s, encodingChannelCovariateCartesian(s));
  const group = encodingField(s, 'color');

  const summedByGroup = groupAndSumByProperties(values(s), covariate, group, quantitative);
  const keys = stackKeys(summedByGroup);
  const summedByPeriod = summedByGroup.map((item) => {
    return d3.sum(keys.map((key) => item[key]?.value || 0));
  });

  return summedByPeriod;
};

/**
 * sort nested data by date and series category
 * @param {array} data unsorted data set
 * @returns {array} sorted data set
 */
const sort = (data) => {
  const keys = stackKeys(data);
  const sortedDate = data.map((item) => {
    return item.sort((a, b) => {
      return Number(new Date(a.data.key)) - Number(new Date(b.data.key));
    });
  });
  const sortedSeries = sortedDate.sort((a, b) => {
    return keys.indexOf(a.key) - keys.indexOf(b.key);
  });

  return sortedSeries;
};

/**
 * retrieve a numerical value for the stack layout
 * @param {object} d datum
 * @param {string} key property
 * @returns {number}
 */
const stackValue = (d, key) => d[key]?.value || 0;

const _stackData = (s) => {

  const covariate = encodingField(s, encodingChannelCovariateCartesian(s));
  const quantitative = encodingField(s, encodingChannelQuantitative(s));
  const group = encodingField(s, 'color');

  const summed = groupAndSumByProperties(values(s), covariate, group, quantitative);
  const stacker = d3.stack().keys(stackKeys).value(stackValue);
  const stacked = stacker(summed);
  const single = stacked.length === 1;

  // this needs to test for the field instead of
  // the encoding as with feature(s).hasColor()
  // in order to account for value encodings
  const seriesEncoding = encodingField(s, 'color');

  const sanitize = single && !seriesEncoding;

  if (sanitize) {
    // mutate instead of map in order to preserve
    // hidden keys attached to the stack layout
    stacked.forEach((series) => {
        series.key = missingSeries();
        series.forEach((item) => {
          if (item.data.undefined) {
            item.data[missingSeries()] = item.data.undefined;
            delete item.data.undefined;
          }
        });
    });
  }
  const sorted = sort(stacked);

  return metadata(sorted, values(s), s);

};

/**
 * reorganize data from specification into array
 * of values used to render a stacked bar chart
 * @param {object} s Vega Lite specification
 * @returns {array} stacked data series
 */
const stackData = memoize(_stackData);

const _circularData = (s) => {
  let results;

  const grouped = Array.from(d3.group(values(s), encodingValue(s, 'color'))).map(
    ([key, values]) => ({ key, values }),
  );

  const summed = grouped.map(({ key, values }) => {
    return { key, value: d3.sum(values, encodingValue(s, 'theta')) };
  });

  results = summed;

  return metadata(results, values(s), s);

};

/**
 * reorganize data from specification into totals
 * used to render a circular chart
 * @param {object} s Vega Lite specification
 * @returns {array} totals by group
 */
const circularData = memoize(_circularData);

const _lineData = (s) => {

  const quantitative = encodingField(s, encodingChannelQuantitative(s));
  const covariate = encodingField(s, encodingChannelCovariateCartesian(s)) || missingSeries();
  const color = encodingField(s, 'color');

  const summed = groupAndSumByProperties(values(s), covariate, color, quantitative);
  const channels = ['href', 'description', 'tooltip'];
  const results = stackKeys(summed).map((key) => {
    const values = summed
      .filter((item) => !!item[key])
      .map((item) => {
        const bucket = feature(s).isTemporal() ? 'period' : encodingField(s, encodingChannelCovariate(s));
        const result = {
          [bucket]: item.key,
          value: item[key].value,
        };

        channels.forEach((channel) => {
          const value = item[key]?.[encodingField(s, channel)];

          if (value) {
            result[encodingField(s, channel)] = value;
          }
        });

        return result;
      })
      .sort((a, b) => Number(parseTime(a.period)) - Number(parseTime(b.period)));

    return {
      [encodingField(s, 'color') || missingSeries()]: key,
      values,
    };
  });

  return results;
};

/**
 * reorganize data from a specification into
 * array of values used to render a line chart.
 * @param {object} s Vega Lite specification
 * @returns {array} summed values for line chart
 */
const lineData = memoize(_lineData);

/**
 * retrieve data points used for text marks
 * @param {object} s Vega Lite specification
 * @returns {array} data points for text marks
 */
const textData = (s) => {
  return s.data.values;
};

const pointData = identity;

/**
 * wrapper function around data preprocessing functionality
 * @param {object} s Vega Lite specification
 * @returns {array} sorted and aggregated data
 */
const data = (s) => {
  if (feature(s).isBar() || feature(s).isArea()) {
    return stackData(s);
  } else if (feature(s).isLine()) {
    return lineData(s);
  } else if (feature(s).isCircular()) {
    return circularData(s);
  } else if (feature(s).isText(s)) {
    return textData(s);
  } else if (feature(s).hasPoints() && !feature(s).isLine()) {
    return pointData(s);
  }
};

export { data, pointData, sumByCovariates };
