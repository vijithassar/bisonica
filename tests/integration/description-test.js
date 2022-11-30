import qunit from 'qunit'
import { specificationFixture, testSelector, render } from '../test-helpers.js'

const { module, test } = qunit

module('integration > description', () => {
	const charts = ['line', 'temporalBar', 'categoricalBar', 'circular', 'stackedBar']
	charts.forEach((chart) => {
		test(`detects extent for ${chart} chart`, (assert) => {
			const s = specificationFixture(chart)
			const element = render(s)
			const labels = [
				...element.querySelectorAll(testSelector('mark')),
				...element.querySelectorAll(testSelector('marks-mark-point'))
			].map((node) => node.getAttribute('aria-label'))
			assert.ok(labels.some((item) => item.includes('minimum value')), 'detects minimum value')
			assert.ok(labels.some((item) => item.includes('maximum value')), 'detects maximum value')
			assert.ok(labels.some((item) => !item.includes('minimum') && !item.includes('maximum')), 'some marks do not match extent')
		})
	})
	test('detects single minimum and maximum value', (assert) => {
		let s = specificationFixture('circular')
		s.data.values = [
			{group: 'a', value: 1},
			{group: 'b', value: 2},
			{group: 'c', value: 3},
			{group: 'd', value: 4},
			{group: 'e', value: 5}
		]
		const element = render(s)
		const labels = [
			...element.querySelectorAll(testSelector('mark'))
		].map((node) => node.getAttribute('aria-label'))
		assert.equal(labels.filter((item) => item.includes('minimum value')).length, 1, 'detects single minimum value')
		assert.equal(labels.filter((item) => item.includes('maximum value')).length, 1, 'detects single maximum value')
	})
	test('detects multiple minimum and maximum values', (assert) => {
		let s = specificationFixture('circular')
		s.data.values = [
			{group: 'a', value: 1},
			{group: 'b', value: 1},
			{group: 'c', value: 3},
			{group: 'd', value: 5},
			{group: 'e', value: 5}
		]
		const element = render(s)
		const labels = [
			...element.querySelectorAll(testSelector('mark'))
		].map((node) => node.getAttribute('aria-label'))
		assert.equal(labels.filter((item) => item.includes('minimum value')).length, 2, 'detects multiple minimum values')
		assert.equal(labels.filter((item) => item.includes('maximum value')).length, 2, 'detects multiple maximum values')
	})
	test('detects minimum and maximum values in multiple channels', (assert) => {
		const s = {
			title: {
				text: 'multiple channel extent demos'
			},
			mark: {
				type: 'point'
			},
			data: {
				values: [
					{a: 1, b: 1},
					{a: 2, b: 1},
					{a: 3, b: 3},
					{a: 4, b: 5},
					{a: 5, b: 5}
				]
			},
			encoding: {
				x: {
					field: 'a',
					type: 'quantitative'
				},
				y: {
					field: 'b',
					type: 'quantitative'
				}
			}
		}

		const element = render(s)

		const labels = [
			...element.querySelectorAll(testSelector('marks-mark-point'))
		].map((node) => node.getAttribute('aria-label'))
		assert.equal(labels.filter((item) => item.includes('minimum value of a')).length, 1, 'detects single minimum value in field a')
		assert.equal(labels.filter((item) => item.includes('maximum value of a')).length, 1, 'detects single maximum value in field a')
		assert.equal(labels.filter((item) => item.includes('minimum value of b')).length, 2, 'detects multiple minimum values in field b')
		assert.equal(labels.filter((item) => item.includes('maximum value of b')).length, 2, 'detects multiple maximum values in field b')
	})
})
