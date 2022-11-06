import { encodingChannelCovariateCartesian, encodingField } from './encodings.js';
import { feature } from './feature.js';
import { values } from './helpers.js';

const metadataChannels = ['description', 'tooltip', 'href'];
const encodingChannels = ['x', 'y', 'color'];

/**
 * create a function for looking up core encoding channels
 * and returning them as a string key suitable for indexing
 * @param {object} s Vega Lite specification
 * @returns {function(object)} convert datum to string key
 */
const createKeyBuilder = (s) => {
    const delimiter = ' + ';
    let channels = [];
    if (feature(s).hasColor()) {
        channels.push('color');
    }
    if (feature(s).isCartesian()) {
        channels.push(encodingChannelCovariateCartesian(s));
    }
    const fields = channels.map(channel => encodingField(s, channel))
    const getters = fields.map((field) => (item) => item[field]);
    const getter = (item) => getters.map(getter => getter(item)).join(delimiter);
    return getter;
};

/**
 * create a function which extracts the necessary
 * metadata fields from an input object
 * @param {object} s Vega Lite specification
 * @returns {function(object)} extract metadata fields
 */
const createPicker = (s) => {
    return (item) => {
        let result = {};
        let fields = metadataChannels
            .map((channel) => encodingField(s, channel))
            .filter(Boolean);
        fields.forEach(field => {
            if (item[field]) {
                result[field] = item[field];
            }
        })
        return result;
    }
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
    let channels = encodingChannels
        .filter((channel) => s.encoding[channel])
    const fields = channels
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
    const counter = {};
    const createKey = createKeyBuilder(s);
    const pick = createPicker(s);
    raw.forEach((item) => {
        const key = createKey(item);
        if (!counter[key]) {
            counter[key] = {count: 0};
        }
        counter[key].count++;
        counter[key].fields = pick(item);
    });
    aggregated.forEach(item => {
        const key = createKey(lookup(s, item));
    })
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