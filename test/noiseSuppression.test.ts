import { describe, expect, test } from 'bun:test';
import {
	composeNoiseSuppressors,
	createEnergyGateNoiseSuppressor,
	createPassThroughNoiseSuppressor
} from '../src/noiseSuppression';
import type { AudioFormat } from '../src/types';

const FORMAT: AudioFormat = {
	channels: 1,
	container: 'raw',
	encoding: 'pcm_s16le',
	sampleRateHz: 16_000
};

const sine = (durationMs: number, amplitude: number, frequencyHz = 440) => {
	const sampleCount = Math.floor((durationMs / 1_000) * FORMAT.sampleRateHz);
	const samples = new Int16Array(sampleCount);
	for (let index = 0; index < sampleCount; index += 1) {
		samples[index] = Math.round(
			Math.sin((2 * Math.PI * frequencyHz * index) / FORMAT.sampleRateHz) *
				amplitude *
				0x7fff
		);
	}
	return new Uint8Array(samples.buffer);
};

const measureRms = (bytes: Uint8Array) => {
	const samples = new Int16Array(
		bytes.buffer,
		bytes.byteOffset,
		bytes.byteLength / 2
	);
	let sumSquares = 0;
	for (const sample of samples) {
		const normalized = sample / 0x7fff;
		sumSquares += normalized * normalized;
	}
	return Math.sqrt(sumSquares / Math.max(1, samples.length));
};

describe('createPassThroughNoiseSuppressor', () => {
	test('returns bytes equal to the input', async () => {
		const input = sine(100, 0.5);
		const out = await createPassThroughNoiseSuppressor().process({
			format: FORMAT,
			pcm: input
		});
		expect(out.bytes.byteLength).toBe(input.byteLength);
		expect(out.format).toEqual(FORMAT);
	});

	test('rejects non-pcm_s16le formats', () => {
		expect(() =>
			createPassThroughNoiseSuppressor().process({
				format: { ...FORMAT, encoding: 'pcm_f32le' } as AudioFormat,
				pcm: new Uint8Array(2)
			})
		).toThrow();
	});
});

describe('createEnergyGateNoiseSuppressor', () => {
	test('passes loud audio through near-original amplitude', async () => {
		const input = sine(500, 0.6);
		const gate = createEnergyGateNoiseSuppressor({ thresholdRms: 0.02 });
		const out = await gate.process({ format: FORMAT, pcm: input });
		const inputRms = measureRms(input);
		const outputRms = measureRms(out.bytes);
		expect(outputRms / inputRms).toBeGreaterThan(0.7);
	});

	test('attenuates quiet audio below the threshold toward the floor', async () => {
		const input = sine(500, 0.005);
		const gate = createEnergyGateNoiseSuppressor({
			floorAmplitudeRatio: 0.05,
			thresholdRms: 0.02
		});
		const out = await gate.process({ format: FORMAT, pcm: input });
		const inputRms = measureRms(input);
		const outputRms = measureRms(out.bytes);
		expect(outputRms).toBeLessThan(inputRms * 0.2);
	});
});

describe('composeNoiseSuppressors', () => {
	test('applies suppressors in order', async () => {
		const input = sine(200, 0.4);
		const composed = composeNoiseSuppressors({
			suppressors: [
				createPassThroughNoiseSuppressor(),
				createEnergyGateNoiseSuppressor({ thresholdRms: 0.02 })
			]
		});
		const out = await composed.process({ format: FORMAT, pcm: input });
		expect(out.bytes.byteLength).toBe(input.byteLength);
	});
});
