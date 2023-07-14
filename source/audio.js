/**
 * convert data values to audio frequencies and play them with a synthesizer
 * @module audio
 */

import * as d3 from 'd3'
import { data } from './data.js'
import { dispatchers } from './interactions.js'
import { feature } from './feature.js'
import { markInteractionSelector } from './marks.js'
import { missingSeries, noop } from './helpers.js'
import { extension } from './extensions.js'

const context = new window.AudioContext()

const tuning = 440

const defaults = {
	root: tuning / 2,
	octaves: 2,
	tempo: 160
}

/**
 * root note for the musical scale
 * @param {object} s Vega Lite specification
 * @return {number} root frequency
 */
const root = s => extension(s, 'audio')?.root || defaults.root

/**
 * octaves spread which repeats the musical scale
 * @param {object} s Vega Lite specification
 * @return {number} number of octaves
 */
const octaves = s => extension(s, 'audio')?.octaves || defaults.octaves

/**
 * tempo
 * @param {object} s Vega Lite specification
 * @return {number} tempo in beats per minute
 */
const tempo = s => extension(s, 'audio')?.tempo || defaults.tempo

/**
 * note duration
 * @param {object} s Vega Lite specification
 * @return {number} note duration
 */
const duration = s => 60 / tempo(s) / 2

const temperament = Math.pow(2, 1 / 12)

/**
 * generate frequencies for a chromatic scale
 * @param {number} root root frequency
 * @return {number[]} chromatic audio scale
 */
const chromatic = root => {
	return Array.from({ length: 13 }).map((step, index) => root * Math.pow(temperament, index))
}

/**
 * linear division of a data range into a minor scale
 * @param {number} min minimum value
 * @param {number} max maximum value
 * @return {number[]} minor scale in linear data space
 */
const minorLinear = (min, max) => {
	const h = (max - min) / 12
	const w = h * 2
	const steps = [0, w, h, w, w, h, w, w]

	return steps.map((_, index) => {
		return d3.sum(steps.slice(0, index)) + min
	})
}

/**
 * minor scale
 * @param {number} root root frequency
 * @return {number[]} minor audio scale
 */
const minorExponential = root => {
	const semitones = [0, 2, 3, 5, 7, 8, 10, 12]

	return chromatic(root).filter((_, index) => semitones.includes(index))
}

/**
 * play a note
 * @param {object} s Vega Lite specification
 * @param {number} frequency audio frequency
 * @param {number} start start time
 */
const note = (s, frequency, start) => {
	const oscillator = context.createOscillator()
	const gainNode = context.createGain()

	gainNode.gain.setValueAtTime(1.0, context.currentTime + start)

	const end = context.currentTime + start + duration(s)

	oscillator.connect(gainNode)
	gainNode.connect(context.destination)

	oscillator.frequency.value = frequency

	gainNode.gain.setValueAtTime(context.currentTime + start * 0.8, 1)
	gainNode.gain.linearRampToValueAtTime(0.001, end)

	oscillator.start(context.currentTime + start)
	oscillator.stop(end)
}

/**
 * repeat a scale across octaves in linear data space
 * @param {object} s Vega Lite specification
 * @param {number} min minimum value
 * @param {number} max maximum value
 * @return {number[]} multiple octave data scale
 */
const repeatLinear = (s, min, max) => {
	const spread = max - min
	const slice = spread / octaves(s)

	return Array.from({ length: octaves(s) })
		.map((_, index) => {
			const start = slice * index + min
			const end = slice * (index + 1) + min
			const steps = minorLinear(start, end).map(item => item + start)

			return index === 0 ? steps : steps.slice(1)
		})
		.flat()
}

/**
 * repeat a scale across octaves in audio space
 * @param {object} s Vega Lite specification
 * @param {number} min minimum value
 * @param {number} max maximum value
 * @return {number[]} multiple octave audio scale
 */
const repeatExponential = (s, min, max) => {
	if (max % min !== 0) {
		console.error('endpoints supplied for exponential scale repetition are not octaves')
	}

	return Array.from({ length: octaves(s) })
		.map((_, index) => {
			const steps = minorExponential(min * 2 ** index)

			return index === 0 ? steps : steps.slice(1)
		})
		.flat()
}

/**
 * handle playback of musical notes
 * @param {object[]} values data values
 * @param {object} dispatcher interaction dispatcher
 * @param {object} s Vega Lite specification
 */
const notes = (values, dispatcher, s) => {
	const [min, max] = d3.extent(values, d => d.value)
	const domain = repeatLinear(s, feature(s).isBar() ? 0 : min, max)
	const range = repeatExponential(s, root(s), root(s) * 2 ** octaves(s))
	const scale = d3.scaleThreshold().domain(domain).range(range)

	const pitches = values.map(({ value }) => scale(value))

	pitches.forEach((pitch, index) => {
		note(s, pitch, index * duration(s))
		setTimeout(() => {
			dispatcher.call('focus', null, index, s)
		}, (index + 1) * duration(s) * 1000)
	})
}

/**
 * audio sonification
 * @param {object} s Vega Lite specification
 * @return {function(object)} audio sonification function
 */
const audio = s => {
	if (s.layer) {
		return noop
	}

	return wrapper => {
		const single = data(s)?.length === 1
		const playable =
      (feature(s).isLine() && single) ||
      (feature(s).isBar() && single) ||
      feature(s).isCircular()
		const disabled = extension(s, 'audio') === null

		if (!playable || disabled) {
			return
		}

		let values

		if (feature(s).isLine()) {
			({ values } = data(s)[0])
		} else if (feature(s).isCircular()) {
			values = data(s)
		} else if (feature(s).isBar()) {
			values = data(s)[0].map(item => {
				return { value: item.data[missingSeries()].value }
			})
		}

		if (!values) {
			return
		}

		const dispatcher = dispatchers.get(wrapper.node())

		dispatcher.on('play', (values, s) => {
			notes(values, dispatcher, s)
		})

		dispatcher.on('focus', index => {
			wrapper.selectAll(markInteractionSelector(s)).nodes()[index].focus()

			if (index === values.length - 1) {
				playing = false
			}
		})

		const play = wrapper.append('div').classed('play', true).text('▶')
		let playing = false

		play.on('click', () => {
			if (!playing) {
				dispatcher.call('play', null, values, s)
				playing = true
			}
		})
	}
}

export { audio }
