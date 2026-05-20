import type { AudioFormat } from './types';
import type {
	NoiseSuppressor,
	NoiseSuppressorInput,
	NoiseSuppressorOutput
} from './noiseSuppression';

/**
 * A fixed-frame denoiser callback. Receives exactly `frameSize` mono
 * Int16 samples and returns the same number of denoised samples. This is
 * the shape Krisp, RNNoise, and DeepFilterNet native SDKs expose.
 */
export type NoiseSuppressionFrameProcessor = {
	frameSize: number;
	processFrame: (frame: Int16Array) => Int16Array | Promise<Int16Array>;
	close?: () => Promise<void> | void;
};

export type CreateFrameProcessorNoiseSuppressorOptions = {
	processor: NoiseSuppressionFrameProcessor;
	/** Override the `kind` tag (defaults to "frame-processor"). */
	kind?: string;
	/**
	 * When true, a trailing partial frame is held back and prepended to the
	 * next chunk so frames stay aligned across calls. Defaults to true.
	 */
	bufferPartialFrames?: boolean;
};

const ensureSupportedFormat = (format: AudioFormat) => {
	if (format.container !== 'raw' || format.encoding !== 'pcm_s16le') {
		throw new Error(
			`createFrameProcessorNoiseSuppressor requires raw pcm_s16le input (got container=${format.container}, encoding=${format.encoding})`
		);
	}
	if (format.channels !== 1) {
		throw new Error(
			`createFrameProcessorNoiseSuppressor requires mono input (got channels=${format.channels})`
		);
	}
};

const toInt16Array = (pcm: ArrayBuffer | ArrayBufferView): Int16Array => {
	if (pcm instanceof Int16Array) return pcm;
	if (pcm instanceof ArrayBuffer) return new Int16Array(pcm);
	return new Int16Array(
		pcm.buffer,
		pcm.byteOffset,
		Math.floor(pcm.byteLength / 2)
	);
};

/**
 * Adapts any fixed-frame denoiser into the streaming `NoiseSuppressor`
 * interface. Buffers inbound PCM into exact `frameSize` frames, runs the
 * processor per frame, and carries any leftover samples to the next call so
 * frames never tear across chunk boundaries. Commercial SDKs (Krisp) and
 * open models (RNNoise/DeepFilterNet) plug in without this package taking a
 * dependency on them.
 */
export const createFrameProcessorNoiseSuppressor = (
	options: CreateFrameProcessorNoiseSuppressorOptions
): NoiseSuppressor => {
	const { processor } = options;
	const frameSize = processor.frameSize;
	if (!Number.isInteger(frameSize) || frameSize <= 0) {
		throw new Error(
			`frameProcessor.frameSize must be a positive integer (got ${frameSize})`
		);
	}
	const bufferPartial = options.bufferPartialFrames !== false;
	let carry = new Int16Array(0);

	const process = async (
		input: NoiseSuppressorInput
	): Promise<NoiseSuppressorOutput> => {
		ensureSupportedFormat(input.format);
		const incoming = toInt16Array(input.pcm);
		const combined = new Int16Array(carry.length + incoming.length);
		combined.set(carry, 0);
		combined.set(incoming, carry.length);

		const fullFrames = Math.floor(combined.length / frameSize);
		const processedSampleCount = fullFrames * frameSize;
		const output = new Int16Array(processedSampleCount);

		for (let frame = 0; frame < fullFrames; frame += 1) {
			const start = frame * frameSize;
			const slice = combined.subarray(start, start + frameSize);
			const denoised = await Promise.resolve(processor.processFrame(slice));
			if (denoised.length !== frameSize) {
				throw new Error(
					`frameProcessor.processFrame must return ${frameSize} samples (got ${denoised.length})`
				);
			}
			output.set(denoised, start);
		}

		carry = bufferPartial
			? combined.slice(processedSampleCount)
			: new Int16Array(0);

		return {
			bytes: new Uint8Array(
				output.buffer,
				output.byteOffset,
				output.byteLength
			),
			format: input.format
		};
	};

	return {
		close: async () => {
			carry = new Int16Array(0);
			await Promise.resolve(processor.close?.());
		},
		kind: options.kind ?? 'frame-processor',
		process
	};
};

export type KrispFrameProcessor = {
	/** Krisp processes 10ms frames; at 48kHz that is 480 mono samples. */
	processFrame: (frame: Int16Array) => Int16Array | Promise<Int16Array>;
	close?: () => Promise<void> | void;
	frameSize?: number;
};

export type CreateKrispNoiseSuppressorOptions = {
	/** A licensed Krisp processor instance the caller wires in. */
	processor: KrispFrameProcessor;
	/** Frame size in mono samples. Defaults to 480 (10ms @ 48kHz). */
	frameSize?: number;
};

/**
 * Thin Krisp adapter. Krisp is commercial — install and license their SDK,
 * then pass an object whose `processFrame(Int16Array)` calls into it. Defaults
 * to Krisp's native 10ms (480-sample @ 48kHz) framing.
 */
export const createKrispNoiseSuppressor = (
	options: CreateKrispNoiseSuppressorOptions
): NoiseSuppressor =>
	createFrameProcessorNoiseSuppressor({
		kind: 'krisp',
		processor: {
			frameSize: options.frameSize ?? options.processor.frameSize ?? 480,
			processFrame: options.processor.processFrame,
			...(options.processor.close
				? { close: options.processor.close }
				: {})
		}
	});
