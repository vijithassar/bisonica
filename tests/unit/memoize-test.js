import { memoize } from '../../source/memoize.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > memoize', () => {
  test('memoizes functions', (assert) => {
    const fn = (input) => {
      return Math.random() + input
    }
    const memoized = memoize(fn)

    assert.equal(memoized(1), memoized(1))
    assert.notEqual(memoized(1), memoized(2))
    assert.equal(memoized(2), memoized(2))
  })

  test('memoizes functions with multiple arguments', (assert) => {
    const fn = (...inputs) => {
      return inputs.reduce((accumulator, current) => {
        return accumulator + current + Math.random()
      }, 0)
    }

    const memoized = memoize(fn)

    assert.equal(memoized(1, 2), memoized(1, 2))
    assert.notEqual(memoized(1, 2), memoized(2, 3))
    assert.equal(memoized(2, 3), memoized(2, 3))
  })

  test('memoizes functions with enclosing scopes', (assert) => {
    let a, b, c;

    // create scopes with anonymous functions

    (() => {
      const value = 'apple'
      a = () => value
    })();
    
    (() => {
      const value = 'banana'
      b = () => value
    })();

    (() => {
      const value = 'cherry'
      c = () => value
    })()

    const _eat = (fn) => {
      return `delicious ${fn()}`
    }

    const eat = memoize(_eat)

    assert.equal(a(), 'apple')
    assert.equal(b(), 'banana')
    assert.equal(c(), 'cherry')

    assert.equal(eat(a), 'delicious apple')
    assert.equal(eat(b), 'delicious banana')
    assert.equal(eat(c), 'delicious cherry')

  })

})
