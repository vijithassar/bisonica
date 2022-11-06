import { encodingChannelCovariateCartesian, encodingField } from './encodings.js';
import { feature } from './feature.js';
import { values } from './helpers.js';

const metadataChannels = ['description', 'tooltip', 'href'];

/**
 * determine which field values match between two objects
 * @param {object} a object to compare
 * @param {object} b object to compare
 * @param {string[]} fields list of fields to compare
 * @returns {string[]} matching fields
 */
const matchingFields = (a, b, fields) => {
    return fields.filter((field) => a[field] === b[field]);
};

/**
 * create a function for looking up core encoding channels
 * and returning them as a string key suitable for indexing
 * @param {object} s Vega Lite specification
 * @returns {function(object)} convert datum to string key
 */
const createKeyBuilder = (s) => {
    const delimiter = ' + ';
    const fields = coreEncodingChannels(s).map(channel => encodingField(s, channel))
    const getters = fields.map((field) => (item) => item[field]);
    const getter = (item) => getters.map(getter => getter(item)).join(delimiter);
    return getter;
};

/**
 * determine which fields contain metadata
 * @param {object} s Vega Lite specification
 */
const metadataFields = (s) => {
    return metadataChannels
        .map((channel) => encodingField(s, channel))
        .filter(Boolean);
};

/**
 * copy desired properties to a sanitized object
 * @param {object} object object with properties
 * @param {string[]} fields desired properties
 * @returns {object} object with only the desired properties
 */
const pick = (object, fields) => {
    let result = {};
    fields.forEach(field => {
        if (object[field]) {
            result[field] = object[field];
        }
    });
    return result;
};

/**
 * determine which core encoding channels are
 * represented in a Vega Lite specification
 * @param {object} s Vega Lite specification
 * @returns {string[]} encoding channels
 */
 const coreEncodingChannels = (s) => {
    let channels = [];
    if (feature(s).hasColor()) {
        channels.push('color');
    }
    if (feature(s).isCartesian()) {
        channels.push(encodingChannelCovariateCartesian(s));
    }
    return channels;
 };

/**
 * count the metadata fields in a data set and look for conflicts
 * @param {object} s Vega Lite specification
 * @param {object[]} data data set to count fields in
 * @param {function} createKey function to create a unique key per datum
 * @returns {object} metadata fields indexed by core field values
 */
const countFields = (s, data, createKey) => {
    const counter = {};
    data.forEach((item) => {
        const key = createKey(item);
        if (!counter[key]) {
            counter[key] = {count: 0};
        }
        const count = counter[key].count++;
        if (count === 1) {
            counter[key].fields = pick(item, metadataFields(s));
        } else if (count > 1) {
            const channels = metadataChannels.map((channel) => encodingField(s, channel)).filter(Boolean);
            const matches = matchingFields(counter[key].fields, pick(item, metadataFields(s)), channels);
            if (matches.length !== channels.length) {
                counter[key].fields = pick(item, matches);
            }
        }
    });
    return counter;
};

/**
 * restructure a data point to make it easier to
 * find the data fields of interest for comparison
 * @param {object} s Vega Lite specification
 * @param {object} item datum
 * @returns {object} object with lookup fields at the top level
 */
const lookup = (s, item) => {
    let result = {};
    const fields = coreEncodingChannels(s)
        .map(channel => encodingField(s, channel))
    if (feature(s).isCircular()) {
        return {
            [fields[0]]: item.key
        };
    }
    return result;
};

/**
 * move properties from an array of source
 * values to an aggregate
 * @param {object} s Vega Lite specification
 * @param {object[]} aggregated aggregated data points
 * @param {object[]} raw individual data points
 * @returns {object[]} aggregated data points with transplanted field attached
 */
const transplantFields = (s, aggregated, raw) => {
    const createKey = createKeyBuilder(s);
    const counter = countFields(s, raw, createKey);
    aggregated.forEach(item => {
        const key = createKey(lookup(s, item));
        Object.assign(item, counter[key]?.fields);
    });
    return aggregated;
};

/**
 * transfer metadata from raw data points to aggregated data
 * @param {object} s Vega Lite specification
 * @param {object[]} data aggregated data for data join
 * @returns {object[]} aggregated data with metadata
 */
const metadata = (s, data) => {
    const layout = feature(s).isBar() || feature(s).isArea() || feature(s).isCircular();
    if (layout) {
        return transplantFields(s, data, values(s));
    }
};

export { metadata, transplantFields };