import type { AudioFormat } from './types';

export type NoiseSuppressorInput = {
	format: AudioFormat;
	pcm: ArrayBuffer | ArrayBufferView;
};

export type NoiseSuppressorOutput = {
	bytes: Uint8Array;
	format: AudioFormat;
};

export type NoiseSuppressor = {
	close?: () => Promise<void> | void;
	kind: string;
	process: (
		input: NoiseSuppressorInput
	) => Promise<NoiseSuppressorOutput> | NoiseSuppressorOutput;
};

const toInt16Array = (
	pcm: ArrayBuffer | ArrayBufferView
): Int16Array => {
	if (pcm instanceof Int16Array) return pcm.slice();
	if (pcm instanceof ArrayBuffer) return new Int16Array(pcm.slice(0));
	const buffer = pcm.buffer.slice(
		pcm.byteOffset,
		pcm.byteOffset + pcm.byteLength
	);
	return new Int16Array(buffer);
};

const ensureSupportedFormat = (format: AudioFormat) => {
	if (format.container !== 'raw' || format.encoding !== 'pcm_s16le') {
		throw new Error(
			`noiseSuppression requires raw pcm_s16le input (got container=${format.container}, encoding=${format.encoding})`
		);
	}
};

export const createPassThroughNoiseSuppressor = (): NoiseSuppressor => ({
	kind: 'pass-through',
	process: ({ format, pcm }) => {
		ensureSupportedFormat(format);
		const bytes =
			pcm instanceof Uint8Array
				? new Uint8Array(pcm)
				: pcm instanceof ArrayBuffer
					? new Uint8Array(pcm.slice(0))
					: new Uint8Array(
							pcm.buffer.slice(
								pcm.byteOffset,
								pcm.byteOffset + pcm.byteLength
							)
						);
		return { bytes, format };
	}
});

export type EnergyGateNoiseSuppressorOptions = {
	attackMs?: number;
	floorAmplitudeRatio?: number;
	holdMs?: number;
	thresholdRms?: number;
};

const DEFAULT_THRESHOLD_RMS = 0.012;
const DEFAULT_HOLD_MS = 80;
const DEFAULT_ATTACK_MS = 8;
const DEFAULT_FLOOR_RATIO = 0.05;

export const createEnergyGateNoiseSuppressor = (
	options: EnergyGateNoiseSuppressorOptions = {}
): NoiseSuppressor => {
	const thresholdRms = options.thresholdRms ?? DEFAULT_THRESHOLD_RMS;
	const holdMs = options.holdMs ?? DEFAULT_HOLD_MS;
	const attackMs = options.attackMs ?? DEFAULT_ATTACK_MS;
	const floorRatio = options.floorAmplitudeRatio ?? DEFAULT_FLOOR_RATIO;
	return {
		kind: 'energy-gate',
		process: ({ format, pcm }) => {
			ensureSupportedFormat(format);
			const samples = toInt16Array(pcm);
			const channels = format.channels;
			const framesPerMs = format.sampleRateHz / 1_000;
			const windowFrames = Math.max(1, Math.round(20 * framesPerMs));
			const holdFrames = Math.round(holdMs * framesPerMs);
			const attackFrames = Math.max(1, Math.round(attackMs * framesPerMs));
			const output = new Int16Array(samples.length);
			let openFramesRemaining = 0;
			let gain = floorRatio;
			for (
				let frame = 0;
				frame < samples.length / channels;
				frame += windowFrames
			) {
				const startSample = frame * channels;
				const endSample = Math.min(
					samples.length,
					(frame + windowFrames) * channels
				);
				let sumSquares = 0;
				for (let index = startSample; index < endSample; index += 1) {
					const normalized = samples[index]! / 0x7fff;
					sumSquares += normalized * normalized;
				}
				const rms = Math.sqrt(
					sumSquares / Math.max(1, endSample - startSample)
				);
				const aboveThreshold = rms >= thresholdRms;
				if (aboveThreshold) {
					openFramesRemaining = holdFrames;
				}
				const targetGain = openFramesRemaining > 0 ? 1 : floorRatio;
				const stepCount = Math.max(1, endSample - startSample);
				for (let index = startSample; index < endSample; index += 1) {
					const localStep = (targetGain - gain) / attackFrames;
					gain = Math.max(0, Math.min(1, gain + localStep));
					output[index] = Math.round(samples[index]! * gain);
				}
				openFramesRemaining = Math.max(
					0,
					openFramesRemaining - (endSample - startSample) / channels
				);
			}
			return {
				bytes: new Uint8Array(output.buffer),
				format
			};
		}
	};
};

export type ComposeNoiseSuppressorsOptions = {
	suppressors: NoiseSuppressor[];
};

export const composeNoiseSuppressors = (
	options: ComposeNoiseSuppressorsOptions
): NoiseSuppressor => ({
	close: async () => {
		for (const suppressor of options.suppressors) {
			await Promise.resolve(suppressor.close?.());
		}
	},
	kind: 'composed',
	process: async (input) => {
		let current: NoiseSuppressorOutput = {
			bytes:
				input.pcm instanceof Uint8Array
					? new Uint8Array(input.pcm)
					: input.pcm instanceof ArrayBuffer
						? new Uint8Array(input.pcm.slice(0))
						: new Uint8Array(
								input.pcm.buffer.slice(
									input.pcm.byteOffset,
									input.pcm.byteOffset + input.pcm.byteLength
								)
							),
			format: input.format
		};
		for (const suppressor of options.suppressors) {
			current = await Promise.resolve(
				suppressor.process({
					format: current.format,
					pcm: current.bytes
				})
			);
		}
		return current;
	}
});
