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

export { extension };
