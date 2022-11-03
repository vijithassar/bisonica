import { mark } from "./helpers.js";
import {
    encodingChannelCovariate,
    encodingChannelCovariateCartesian,
    encodingField,
} from './encodings.js';
import { feature } from './feature.js';
import { isDiscrete } from './helpers.js';

/**
 * move properties from an array of source
 * values to an aggregate
 * @param {array} aggregated aggregated data points
 * @param {array} raw individual data points
 * @param {function} matcher find matching values
 * @param {string} key property name for transplanted field
 * @returns {array} aggregated data points with transplanted field attached
 */
const transplantFields = (aggregated, raw, matcher, key) => {
    return aggregated.map((item) => {
        const matches = matcher(item, raw);
        const result = { ...item };
        const allMatch = matches.every((item) => item === matches[0]);

        if (matches.length > 0 && allMatch) {
            result[key] = matches[0];
        }

        return result;
    });
};

/**
 * transfer metadata from raw data points to aggregated stack layout
 * @param {object[]} aggregated aggregated data for data join
 * @param {object[]} raw raw data with metadata
 * @param {object} s Vega Lite specification
 * @returns {object[]} aggregated data with metadata
 */
const transplantStackedBarMetadata = (aggregated, raw, s) => {
    const createMatcher = (key) => {
        const matcher = (aggregatedItem, raw) => {
            const laneChannel = encodingChannelCovariateCartesian(s);
            const keys = {
                lane: encodingField(s, laneChannel),
                series: encodingField(s, 'color'),
            };
            const matches = raw
                .filter((rawItem) => {
                    let seriesMatch;

                    // single-color categorical charts are still plotted using separate series nodes
                    if (feature(s).hasColor() || isDiscrete(s, encodingChannelCovariate(s))) {
                        seriesMatch = aggregatedItem[keys.series] === rawItem[keys.series];
                    } else {
                        seriesMatch = true;
                    }

                    const laneMatch =
                        aggregatedItem[keys.lane] &&
                        rawItem[keys.lane] &&
                        aggregatedItem[keys.lane]?.toString() === rawItem[keys.lane]?.toString();
                    const hasField = !!rawItem[key];

                    return seriesMatch && laneMatch && hasField;
                })
                .map((item) => item[key])
                .filter(Boolean);

            return matches;
        };

        return matcher;
    };

    const results = [...aggregated];

    results.forEach((series, i) => {
        series.forEach((item, j) => {
            const lookup = {};

            if (encodingField(s, 'color')) {
                lookup[encodingField(s, 'color')] = series.key;
            }

            if (encodingField(s, encodingChannelCovariate(s))) {
                lookup[encodingField(s, encodingChannelCovariate(s))] = item.data.key;
            }

            const channels = ['href', 'description', 'tooltip'];
            const fields = channels.map((channel) => encodingField(s, channel));

            fields.forEach((field) => {
                const value = transplantFields([lookup], s.data.values, createMatcher(field), field).pop()[
                    field
                ];

                if (value) {
                    // the reference to the datum object is shared across marks by the d3 layout generator, so
                    // this needs to be set as a non-enumerable property on the array, which is a bit odd but
                    // also how the datum object is already stored
                    Object.defineProperty(results[i][j], field, {
                        value,
                    });
                }
            });
        });
    });

    return results;
};

/**
 * transfer metadata from raw data points to aggregated circular layout
 * @param {object[]} aggregated aggregated data for data join
 * @param {object[]} raw raw data with metadata
 * @param {object} s Vega Lite specification
 * @returns {object[]} aggregated data with metadata
 */
const transplantCircularMetadata = (aggregated, raw, s) => {
    const createMatcher = (channel) => {
        return (aggregatedItem, raw) => {
            return raw
                .filter((rawItem) => {
                    const currentAggregateDatumField = aggregatedItem.key.toString();
                    const rawDatumField = rawItem[encodingField(s, 'color')].toString();

                    return currentAggregateDatumField === rawDatumField;
                })
                .map((item) => {
                    return item[encodingField(s, channel)];
                });
        };
    };

    const channels = ['href', 'description', 'tooltip'];
    channels.forEach((channel) => {
        if (s.encoding[channel]) {
            aggregated = transplantFields(
                [...aggregated],
                s.data.values,
                createMatcher(channel),
                encodingField(s, channel),
            );
        }
    });
    return aggregated;
};

/**
 * transfer metadata from raw data points to aggregated data
 * @param {object[]} aggregated aggregated data for data join
 * @param {object[]} raw raw data with metadata
 * @param {object} s Vega Lite specification
 * @returns {object[]} aggregated data with metadata
 */
const metadata = (aggregated, raw, s) => {
    if (mark(s) === 'bar' || mark(s) === 'area') {
        return transplantStackedBarMetadata(aggregated, raw, s);
    } else if (mark(s) === 'arc') {
        return transplantCircularMetadata(aggregated, raw, s);
    } else {
        return aggregated;
    }
};

export { metadata, transplantFields };