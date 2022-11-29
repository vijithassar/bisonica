const references = {
  count: 0,
  map: new WeakMap(),
};

const argumentKey = (arg) => {
  const type = typeof arg;
  const primitive = type !== 'object' && type !== 'function';

  if (primitive) {
    return `${arg}`;
  } else {
    if (references.map.has(arg)) {
      return `${type}-${references.map.get(arg)}`;
    } else {
      const id = `${references.count++}`;

      references.map.set(arg, id);

      return `${type}-${id}`;
    }
  }
};

const memoizeKey = (args) => {
  return args.map(argumentKey).join(' ');
};

/**
 * cache function results to avoid recomputation
 * @param {function} fn pure function to be cached
 * @returns {function} memoized function which caches return values
 */
const memoize = (fn) => {
  const cache = new Map();

  return function (...args) {
    const key = memoizeKey(args);

    if (cache.has(key)) {
      return cache.get(key);
    } else {
      const result = fn.apply(this, args);

      cache.set(key, result);

      return result;
    }
  };
};

export { memoize };
