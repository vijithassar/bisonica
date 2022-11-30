import { data } from '../../source/data.js'
import { encodingField } from '../../source/encodings.js'
import { specificationFixture } from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

module('unit > metadata', () => {
	const urlData = () => {
		return [
			{ value: 1, group: 'a', label: '2020-01-01', url: 'https://example.com/a' },
			{ value: 1, group: 'a', label: '2020-01-02', url: 'https://example.com/a' },
			{ value: 2, group: 'b', label: '2020-01-03', url: 'https://example.com/b' },
			{ value: 2, group: 'b', label: '2020-01-04', url: 'https://example.com/b' },
			{ value: 2, group: 'b', label: '2020-01-05', url: 'https://example.com/b' },
			{ value: 3, group: 'c', label: '2020-01-06', url: 'https://example.com/c' },
			{ value: 3, group: 'c', label: '2020-01-07', url: 'https://example.com/c' },
			{ value: 3, group: 'c', label: '2020-01-07', url: 'https://example.com/c' }
		]
	}

	const mismatch = (data) => {
		data[data.length - 1].url = 'https://example.com/d'
		return data
	}

	test('transfers urls to aggregated circular chart segments', (assert) => {
		const s = {
			data: {
				values: urlData()
			},
			mark: {
				type: 'arc'
			},
			encoding: {
				color: { field: 'group' },
				href: { field: 'url' },
				theta: { field: 'value' }
			}
		}

		assert.ok(data(s).every((item) => item.url.startsWith('https://example.com/')))
	})

	test('avoids transplanting mismatched data in aggregated circular chart segments', (assert) => {
		const s = {
			data: {
				values: mismatch(urlData())
			},
			mark: {
				type: 'arc'
			},
			encoding: {
				color: { field: 'group' },
				href: { field: 'url' },
				theta: { field: 'value' }
			}
		}

		data(s).forEach((item) => {
			const url = item[encodingField(s, 'href')]
			const check = url?.startsWith('https://example.com/')
			if (item.key === 'c') {
				assert.notOk(check)
			} else {
				assert.ok(check)
			}
		})
	})

	test('transfers urls to aggregated stacked bar chart segments', (assert) => {
		const s = {
			data: {
				values: urlData()
			},
			mark: { type: 'bar' },
			encoding: {
				color: { field: 'group', type: 'nominal' },
				href: { field: 'url' },
				x: { field: 'label', type: 'temporal' },
				y: { aggregate: 'value', type: 'quantitative' }
			}
		}

		data(s).forEach((series) => {
			series.forEach((item) => {
				const difference = Math.abs(item[1] - item[0]) !== 0

				if (difference) {
					const url = item[encodingField(s, 'href')]

					assert.ok(url.startsWith('https://example.com/'))
				}
			})
		})
	})

	test('avoids transplanting mismatched data in aggregated stacked bar chart segments', (assert) => {
		const s = {
			data: {
				values: mismatch(urlData())
			},
			mark: { type: 'bar' },
			encoding: {
				color: { field: 'group', type: 'nominal' },
				href: { field: 'url' },
				x: { field: 'label', type: 'temporal' },
				y: { aggregate: 'value', type: 'quantitative' }
			}
		}

		data(s).forEach((series) => {
			series.forEach((item) => {
				const difference = Math.abs(item[1] - item[0]) !== 0

				if (difference) {
					const url = item[encodingField(s, 'href')]
					const check = url?.startsWith('https://example.com/')
					if (item.data.key === '2020-01-07') {
						assert.notOk(check)
					} else {
						assert.ok(check)
					}
				}
			})
		})
	})

	test('copies multiple metadata fields', (assert) => {
		const s = specificationFixture('circular')
		s.data.values = [
			{ a: '•', b: '-', c: 'https://www.example.com/a', group: 'a', value: 95 },
			{ a: '+', b: '_', c: 'https://www.example.com/b', group: 'b', value: 3 },
			{ a: '@', b: '|', c: 'https://www.example.com/c', group: 'c', value: 2 }
		]
		s.encoding.tooltip = { field: 'a' }
		s.encoding.description = { field: 'b' }
		s.encoding.href = { field: 'c' }
		data(s).forEach(item => {
			assert.equal(typeof item.a, 'string')
			assert.equal(typeof item.b, 'string')
			assert.equal(typeof item.c, 'string')
		})
	})
})
