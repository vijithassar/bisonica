import { encodingChannelCovariateCartesian, encodingField } from './encodings.js';
import { feature } from './feature.js';
import { values } from './helpers.js';

const metadataChannels = ['description', 'tooltip', 'href'];
const encodingChannels = ['x', 'y', 'color'];

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
    const pluck = createPlucker(s);
    raw.forEach((item) => {
        const key = createKey(item);
        if (!counter[key]) {
            counter[key] = {count: 0};
        }
        counter[key].count++;
        counter[key].fields = pluck(item);
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