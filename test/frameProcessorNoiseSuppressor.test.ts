import { describe, expect, test } from 'bun:test';
import {
	createFrameProcessorNoiseSuppressor,
	createKrispNoiseSuppressor
} from '../src/frameProcessorNoiseSuppressor';
import type { AudioFormat } from '../src/types';

const FORMAT: AudioFormat = {
	channels: 1,
	container: 'raw',
	encoding: 'pcm_s16le',
	sampleRateHz: 48_000
};

const int16Bytes = (samples: number[]) =>
	new Uint8Array(Int16Array.from(samples).buffer);

describe('createFrameProcessorNoiseSuppressor', () => {
	test('processes exact-multiple frames and returns same length', async () => {
		const seen: number[] = [];
		const suppressor = createFrameProcessorNoiseSuppressor({
			processor: {
				frameSize: 4,
				processFrame: (frame) => {
					seen.push(frame.length);
					return frame.map((sample) => Math.round(sample / 2));
				}
			}
		});
		const out = await suppressor.process({
			format: FORMAT,
			pcm: int16Bytes([100, 200, 300, 400, 500, 600, 700, 800])
		});
		const result = new Int16Array(
			out.bytes.buffer,
			out.bytes.byteOffset,
			out.bytes.byteLength / 2
		);
		expect(seen).toEqual([4, 4]);
		expect(Array.from(result)).toEqual([50, 100, 150, 200, 250, 300, 350, 400]);
	});

	test('buffers partial trailing frame across calls', async () => {
		const processedFrames: number[][] = [];
		const suppressor = createFrameProcessorNoiseSuppressor({
			processor: {
				frameSize: 3,
				processFrame: (frame) => {
					processedFrames.push(Array.from(frame));
					return frame;
				}
			}
		});
		// 4 samples → 1 full frame (3), 1 carried
		const first = await suppressor.process({
			format: FORMAT,
			pcm: int16Bytes([1, 2, 3, 4])
		});
		expect(first.bytes.byteLength).toBe(3 * 2);
		expect(processedFrames).toEqual([[1, 2, 3]]);
		// 2 more samples → carry [4] + [5,6] = [4,5,6] one full frame
		const second = await suppressor.process({
			format: FORMAT,
			pcm: int16Bytes([5, 6])
		});
		expect(second.bytes.byteLength).toBe(3 * 2);
		expect(processedFrames).toEqual([
			[1, 2, 3],
			[4, 5, 6]
		]);
	});

	test('rejects non-mono input', async () => {
		const suppressor = createFrameProcessorNoiseSuppressor({
			processor: { frameSize: 2, processFrame: (frame) => frame }
		});
		await expect(
			suppressor.process({
				format: { ...FORMAT, channels: 2 },
				pcm: int16Bytes([1, 2])
			})
		).rejects.toThrow(/mono/);
	});

	test('throws when processFrame returns wrong sample count', async () => {
		const suppressor = createFrameProcessorNoiseSuppressor({
			processor: {
				frameSize: 2,
				processFrame: () => new Int16Array(3)
			}
		});
		await expect(
			suppressor.process({ format: FORMAT, pcm: int16Bytes([1, 2]) })
		).rejects.toThrow(/2 samples/);
	});

	test('close() flushes carry and calls processor.close', async () => {
		let closed = false;
		const suppressor = createFrameProcessorNoiseSuppressor({
			processor: {
				close: () => {
					closed = true;
				},
				frameSize: 4,
				processFrame: (frame) => frame
			}
		});
		await suppressor.process({ format: FORMAT, pcm: int16Bytes([1, 2]) });
		await suppressor.close?.();
		expect(closed).toBe(true);
	});

	test('kind defaults to frame-processor and is overridable', () => {
		const a = createFrameProcessorNoiseSuppressor({
			processor: { frameSize: 1, processFrame: (frame) => frame }
		});
		const b = createFrameProcessorNoiseSuppressor({
			kind: 'custom',
			processor: { frameSize: 1, processFrame: (frame) => frame }
		});
		expect(a.kind).toBe('frame-processor');
		expect(b.kind).toBe('custom');
	});
});

describe('createKrispNoiseSuppressor', () => {
	test('defaults to 480-sample frames and kind=krisp', async () => {
		const seenFrameSizes: number[] = [];
		const suppressor = createKrispNoiseSuppressor({
			processor: {
				processFrame: (frame) => {
					seenFrameSizes.push(frame.length);
					return frame;
				}
			}
		});
		expect(suppressor.kind).toBe('krisp');
		const pcm = new Uint8Array(480 * 2); // exactly one Krisp frame
		await suppressor.process({ format: FORMAT, pcm });
		expect(seenFrameSizes).toEqual([480]);
	});

	test('honors a custom frameSize', async () => {
		const seen: number[] = [];
		const suppressor = createKrispNoiseSuppressor({
			frameSize: 160,
			processor: {
				processFrame: (frame) => {
					seen.push(frame.length);
					return frame;
				}
			}
		});
		await suppressor.process({
			format: { ...FORMAT, sampleRateHz: 16_000 },
			pcm: new Uint8Array(160 * 2)
		});
		expect(seen).toEqual([160]);
	});
});
