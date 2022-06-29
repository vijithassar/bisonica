const references = {
  count: 0,
  map: new WeakMap(),
};

const argumentKey = (arg) => {
  let key;

  const type = typeof arg;

  if (type === 'undefined' || arg === null) {
    key = `${arg}`;
  } else if (type === 'function') {
    key = 'function';
  } else if (type === 'object') {
    key = 'object';
  } else {
    key = arg.toString();
  }

  const primitive = type !== 'object' && type !== 'function';

  if (primitive) {
    return key;
  }

  if (type === 'object' || type === 'function') {
    if (references.map.has(arg)) {
      return `${key}-${references.map.get(arg)}`;
    } else {
      const id = `${references.count++}`;

      references.map.set(arg, id);

      return `${key}-${id}`;
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
