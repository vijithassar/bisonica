import { ascending } from 'd3'
import qunit from 'qunit'
import { parseScales } from '../../source/scales.js'

const { module, test } = qunit

const extra = { group: 'z', label: 'a', value: 3 }
const specification = () => {
	const s = {
		data: {
			values: [
				{ group: 'z', label: 'a', value: 10 },
				{ group: 'y', label: 'b', value: 20 },
				{ group: 'w', label: 'd', value: 15 },
				{ group: 'x', label: 'c', value: 12 },
				{ group: 'u', label: 'f', value: 16 },
				{ group: 'v', label: 'e', value: 25 },
				{ group: 's', label: 'h', value: 22 },
				{ group: 'r', label: 'i', value: 30 },
				{ group: 't', label: 'g', value: 5 }
			]
		},
		mark: { type: 'bar' },
		encoding: {
			x: {
				field: 'label',
				type: 'nominal'
			},
			y: {
				field: 'value',
				type: 'quantitative'
			}
		}
	}

	return s
}

const dates = s => {
	s.data.values = s.data.values.map((item, index) => {
		return { ...item, label: `2021-01-0${index}` }
	})
	s.encoding.x.type = 'temporal'
	s.encoding.x.timeUnit = 'utcday'

	return s
}

const dimensions = { x: 500, y: 500 }

module('unit > sort', () => {
	test('natural sort for quantitative scales', function (assert) {
		const asc = specification()

		asc.mark.type = 'point'

		const desc = specification()

		desc.mark.type = 'point'

		asc.encoding.y.sort = 'ascending'
		desc.encoding.y.sort = 'descending'

		const ascy = parseScales(asc, dimensions).y
		const descy = parseScales(desc, dimensions).y

		assert.deepEqual(ascy.domain(), [...descy.domain()].reverse())
	})
	test('natural sort for time scales', function (assert) {
		const asc = dates(specification())

		asc.mark.type = 'point'

		const desc = dates(specification())

		desc.mark.type = 'point'

		asc.encoding.x.sort = 'ascending'
		desc.encoding.x.sort = 'descending'

		const ascx = parseScales(asc, dimensions).x
		const descx = parseScales(desc, dimensions).x

		assert.deepEqual(ascx.domain(), [...descx.domain()].reverse())
	})

	test('sort by encoding', function (assert) {
		const none = specification()
		const asc = specification()
		const desc = specification()

		const encoding = 'y'
		const { field } = specification().encoding[encoding]

		none.encoding.x.sort = { encoding }
		asc.encoding.x.sort = { encoding, order: 'ascending' }
		desc.encoding.x.sort = { encoding, order: 'descending' }

		const nonex = parseScales(none, dimensions).x
		const ascx = parseScales(asc, dimensions).x
		const descx = parseScales(desc, dimensions).x

		const labels = specification()
			.data.values.slice()
			.sort((a, b) => a[field] - b[field])
			.map(item => item.label)

		assert.deepEqual(nonex.domain(), labels)
		assert.deepEqual(ascx.domain(), labels)
		assert.deepEqual(descx.domain(), [...labels].reverse())
	})

	test('sort by encoding with string shorthand', function (assert) {
		const none = specification()
		const asc = specification()
		const desc = specification()

		const encoding = 'y'
		const { field } = specification().encoding[encoding]

		none.encoding.x.sort = encoding
		asc.encoding.x.sort = encoding
		desc.encoding.x.sort = `-${encoding}`

		const nonex = parseScales(none, dimensions).x
		const ascx = parseScales(asc, dimensions).x
		const descx = parseScales(desc, dimensions).x

		const labels = specification()
			.data.values.slice()
			.sort((a, b) => a[field] - b[field])
			.map(item => item.label)

		assert.deepEqual(nonex.domain(), labels)
		assert.deepEqual(ascx.domain(), labels)
		assert.deepEqual(descx.domain(), [...labels].reverse())
	})

	test('sort by field', function (assert) {
		const none = specification()
		const asc = specification()
		const desc = specification()

		const field = 'value'

		none.encoding.x.sort = { field }
		asc.encoding.x.sort = { field, order: 'ascending' }
		desc.encoding.x.sort = { field, order: 'descending' }

		const nonex = parseScales(asc, dimensions).x
		const ascx = parseScales(asc, dimensions).x
		const descx = parseScales(desc, dimensions).x

		const values = specification()
			.data.values.slice()
			.sort((a, b) => ascending(a[field], b[field]))
		const labels = values.map(item => item.label)

		assert.deepEqual(nonex.domain(), labels)
		assert.deepEqual(ascx.domain(), labels)
		assert.deepEqual(descx.domain(), [...labels].reverse())
	})
	test('array specifies sorting', function (assert) {
		const s = specification()

		const sort = ['a', 'c', 'b', 'd', 'f', 'i', 'h']

		s.encoding.x.sort = sort

		const { x } = parseScales(s, dimensions)

		assert.deepEqual(x.domain().slice(0, sort.length), sort)
	})
	test('remaining items are appended to sort after specified values', function (assert) {
		const s = specification()

		const partial = ['a', 'c']

		s.encoding.x.sort = partial

		const { x } = parseScales(s, dimensions)

		const remaining = specification()
			.data.values.map(item => item.label)
			.filter(item => !partial.includes(item))

		const sort = [...partial, ...remaining]

		assert.deepEqual(x.domain(), sort)
	})
	test('null disables sorting', function (assert) {
		const s = specification()

		s.encoding.x.sort = null

		const unsorted = s.data.values.map(item => item.label)

		const { x } = parseScales(s, dimensions)

		assert.deepEqual(x.domain(), unsorted)
	})
	test('resolves duplicates with min for most charts', function (assert) {
		const s = specification()

		s.mark.type = 'line'
		s.data.values.push(extra)
		s.encoding.x.sort = { field: 'value' }

		const { x } = parseScales(s, dimensions)

		assert.deepEqual(x.domain(), ['a', 'g', 'c', 'd', 'f', 'b', 'h', 'e', 'i'])
	})
	test('resolves duplicates with sum for bar charts', function (assert) {
		const s = specification()

		s.data.values.push(extra)
		s.encoding.x.sort = { field: 'value' }

		const { x } = parseScales(s, dimensions)

		assert.deepEqual(x.domain(), ['g', 'c', 'a', 'd', 'f', 'b', 'h', 'e', 'i'])
	})
})
