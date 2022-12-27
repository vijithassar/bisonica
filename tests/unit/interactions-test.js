import { dispatchers } from '../../source/interactions.js'
import {
	render,
	specificationFixture,
	testSelector
} from '../test-helpers.js'
import qunit from 'qunit'

const { module, test } = qunit

const validateDispatcher = dispatcher => {
	return ['link', 'tooltip'].every(key => typeof dispatcher._[key] === 'object')
}

module('unit > interactions', function() {
	test('registers an event dispatcher for charts with single layer', assert => {
		const element = render(specificationFixture('circular'))

		const mark = element.querySelector(testSelector('mark'))

		const dispatcher = dispatchers.get(mark)
		assert.ok(validateDispatcher(dispatcher), 'layered node has associated event dispatcher')
	})

	test('registers an event dispatcher for charts with multiple layers', assert => {
		const s = {
			title: {
				text: 'donut chart'
			},
			data: {
				values: [
					{ value: 10, group: '*' },
					{ value: 20, group: '_' },
					{ value: 30, group: '•' }
				]
			},
			usermeta: {
				customTooltipHandler: event => {
					console.log(event)
				}
			},
			layer: [
				{
					mark: {
						type: 'arc',
						innerRadius: 50
					},
					encoding: {
						color: {
							field: 'group',
							type: 'nominal'
						},
						theta: {
							field: 'value',
							type: 'quantitative'
						}
					}
				},
				{
					mark: {
						type: 'text',
						text: 60
					},
					encoding: {
						href: {
							value: 'https://www.example.com'
						}
					}
				}
			]
		}

		const element = render(s)

		const layers = [...element.querySelectorAll(testSelector('layer'))]
		layers.forEach((layer, index) => {
			const dispatcher = dispatchers.get(layer)
			assert.ok(validateDispatcher(dispatcher), `layer node at index ${index} has an associated event dispatcher`)
		})
	})
})
