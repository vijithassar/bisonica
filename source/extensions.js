/**
 * retrieve information from usermeta
 * @param {object} s Vega Lite specification
 * @param {string} key usermeta key
 */
const extension = (s, key) => {
    if (s.usermeta?.[key]) {
        return s.usermeta[key];
    }
};

/**
 * initialize usermeta object if it doesn't
 * already exist
 * @param {object} s Vega Lite specification
 */
const usermeta = (s) => {
    if (typeof s.usermeta !== 'object') {
        s.usermeta = {};
    }
}

export { extension, usermeta };
