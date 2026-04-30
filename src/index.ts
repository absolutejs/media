import type { AudioFormat } from './types';

export type MediaFrameKind =
	| 'assistant-audio'
	| 'input-audio'
	| 'interruption'
	| 'metadata'
	| 'transcript'
	| 'turn-commit';

export type MediaFrameSource =
	| 'browser'
	| 'provider'
	| 'telephony'
	| 'voice-runtime';

export type MediaPipelineStatus = 'fail' | 'pass' | 'warn';

export type MediaResamplingPlan = {
	inputFormat: AudioFormat;
	outputFormat: AudioFormat;
	ratio: number;
	required: boolean;
	status: MediaPipelineStatus;
};

export type MediaFrame = {
	at?: number;
	audio?: ArrayBuffer | ArrayBufferView;
	durationMs?: number;
	format?: AudioFormat;
	id: string;
	kind: MediaFrameKind;
	latencyMs?: number;
	metadata?: Record<string, unknown>;
	sessionId?: string;
	source: MediaFrameSource | (string & {});
	traceEventId?: string;
	turnId?: string;
};

export type MediaFrameTransform = {
	inputFormat?: AudioFormat;
	name: string;
	outputFormat?: AudioFormat;
	transform: (
		frame: MediaFrame
	) =>
		| MediaFrame
		| readonly MediaFrame[]
		| undefined
		| Promise<MediaFrame | readonly MediaFrame[] | undefined>;
};

export type MediaFrameTransformPipeline = {
	push: (
		frame: MediaFrame
	) => Promise<readonly MediaFrame[]>;
	pushMany: (
		frames: readonly MediaFrame[]
	) => Promise<readonly MediaFrame[]>;
	transforms: readonly MediaFrameTransform[];
};

export type MediaProcessorNodeKind =
	| 'branch'
	| 'filter'
	| 'processor'
	| 'sink';

export type MediaProcessorNodeEvent = {
	at: number;
	dropped: number;
	emitted: number;
	frameId: string;
	inputs: number;
	node: string;
};

export type MediaProcessorNodeReport = {
	droppedFrames: number;
	emittedFrames: number;
	events: readonly MediaProcessorNodeEvent[];
	inputFrames: number;
	kind: MediaProcessorNodeKind;
	name: string;
	status: MediaPipelineStatus;
};

export type MediaProcessorGraphReport = {
	checkedAt: number;
	droppedFrames: number;
	emittedFrames: number;
	events: readonly MediaProcessorNodeEvent[];
	inputFrames: number;
	name: string;
	nodes: readonly MediaProcessorNodeReport[];
	status: MediaPipelineStatus;
};

export type MediaProcessorNode = {
	inputFormat?: AudioFormat;
	kind?: MediaProcessorNodeKind;
	name: string;
	outputFormat?: AudioFormat;
	process: (
		frame: MediaFrame
	) =>
		| boolean
		| MediaFrame
		| readonly MediaFrame[]
		| undefined
		| Promise<
				boolean | MediaFrame | readonly MediaFrame[] | undefined
		  >;
};

export type MediaProcessorGraph = {
	nodes: readonly MediaProcessorNode[];
	process: (
		frame: MediaFrame
	) => Promise<readonly MediaFrame[]>;
	processMany: (
		frames: readonly MediaFrame[]
	) => Promise<readonly MediaFrame[]>;
	report: () => MediaProcessorGraphReport;
};

export type MediaTransportAdapter = {
	close?: () => Promise<void> | void;
	connect?: () => Promise<void> | void;
	inputFormat?: AudioFormat;
	name: string;
	onFrame?: (
		handler: (frame: MediaFrame) => Promise<void> | void
	) => () => void;
	outputFormat?: AudioFormat;
	send: (frame: MediaFrame) => Promise<void> | void;
};

export type MediaTransportState =
	| 'closed'
	| 'closing'
	| 'failed'
	| 'idle'
	| 'open';

export type MediaTransportEventKind =
	| 'backpressure'
	| 'close'
	| 'connect'
	| 'error'
	| 'frame-in'
	| 'frame-out';

export type MediaTransportEvent = {
	at: number;
	bufferedFrames?: number;
	error?: string;
	frameId?: string;
	kind: MediaTransportEventKind;
	state: MediaTransportState;
};

export type MediaTransportReport = {
	backpressureEvents: number;
	checkedAt: number;
	closed: boolean;
	connected: boolean;
	events: readonly MediaTransportEvent[];
	failed: boolean;
	inputFrames: number;
	name: string;
	outputFrames: number;
	state: MediaTransportState;
	status: MediaPipelineStatus;
};

export type MediaTransport = MediaTransportAdapter & {
	events: () => readonly MediaTransportEvent[];
	receive: (frame: MediaFrame) => Promise<void>;
	report: () => MediaTransportReport;
	state: () => MediaTransportState;
};

export type MediaTransportOptions = {
	inputFormat?: AudioFormat;
	maxBufferedFrames?: number;
	name: string;
	onClose?: () => Promise<void> | void;
	onConnect?: () => Promise<void> | void;
	onSend?: (frame: MediaFrame) => Promise<void> | void;
	outputFormat?: AudioFormat;
};

export type MediaPipelineCalibrationInput = {
	expectedInputFormat?: AudioFormat;
	expectedOutputFormat?: AudioFormat;
	frames?: readonly MediaFrame[];
	inputFormat?: AudioFormat;
	maxBackpressureFrames?: number;
	maxFirstAudioLatencyMs?: number;
	maxJitterMs?: number;
	outputFormat?: AudioFormat;
	requireInterruptionFrame?: boolean;
	requireTraceEvidence?: boolean;
	surface?: string;
};

export type MediaPipelineCalibrationIssue = {
	code: string;
	message: string;
	severity: 'error' | 'warning';
};

export type MediaPipelineCalibrationReport = {
	assistantAudioFrames: number;
	backpressureFrames: number;
	checkedAt: number;
	firstAudioLatencyMs?: number;
	inputAudioFrames: number;
	inputFormat?: AudioFormat;
	interruptionFrames: number;
	issues: MediaPipelineCalibrationIssue[];
	jitterMs?: number;
	outputFormat?: AudioFormat;
	resamplingRequired: boolean;
	resamplingTargetHz?: number;
	status: MediaPipelineStatus;
	surface: string;
	traceLinkedFrames: number;
	turnCommitFrames: number;
};

export type MediaVadInput = {
	frames?: readonly MediaFrame[];
	maxSilenceFrames?: number;
	minSpeechFrames?: number;
	speechEndThreshold?: number;
	speechStartThreshold?: number;
};

export type MediaVadSegment = {
	durationMs?: number;
	endAt?: number;
	frameCount: number;
	segmentId: string;
	sessionId?: string;
	startAt?: number;
	turnId?: string;
};

export type MediaVadReport = {
	checkedAt: number;
	inputAudioFrames: number;
	segments: MediaVadSegment[];
	status: MediaPipelineStatus;
};

export type MediaInterruptionInput = {
	frames?: readonly MediaFrame[];
	maxInterruptionLatencyMs?: number;
};

export type MediaInterruptionReport = {
	checkedAt: number;
	interruptionFrames: number;
	issues: MediaPipelineCalibrationIssue[];
	latenciesMs: number[];
	status: MediaPipelineStatus;
};

const formatLabel = (format: AudioFormat) =>
	`${format.container}/${format.encoding}/${String(format.sampleRateHz)}hz/${String(format.channels)}ch`;

const formatMatches = (actual: AudioFormat, expected: AudioFormat) =>
	actual.container === expected.container &&
	actual.encoding === expected.encoding &&
	actual.sampleRateHz === expected.sampleRateHz &&
	actual.channels === expected.channels;

const pushIssue = (
	issues: MediaPipelineCalibrationIssue[],
	severity: 'error' | 'warning',
	code: string,
	message: string
) => {
	issues.push({ code, message, severity });
};

const numericMetadata = (
	frame: MediaFrame,
	key: string
): number | undefined => {
	const value = frame.metadata?.[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

export const createMediaFrame = (
	frame: MediaFrame
): MediaFrame => frame;

export const buildMediaTransportReport = (input: {
	events?: readonly MediaTransportEvent[];
	name: string;
	state?: MediaTransportState;
}): MediaTransportReport => {
	const events = input.events ?? [];
	const state = input.state ?? events.at(-1)?.state ?? 'idle';
	const backpressureEvents = events.filter(
		(event) => event.kind === 'backpressure'
	).length;
	const failed = state === 'failed' || events.some((event) => event.kind === 'error');

	return {
		backpressureEvents,
		checkedAt: Date.now(),
		closed: state === 'closed',
		connected: state === 'open',
		events,
		failed,
		inputFrames: events.filter((event) => event.kind === 'frame-in').length,
		name: input.name,
		outputFrames: events.filter((event) => event.kind === 'frame-out').length,
		state,
		status: failed ? 'fail' : backpressureEvents > 0 ? 'warn' : 'pass'
	};
};

export const createMediaTransport = (
	options: MediaTransportOptions
): MediaTransport => {
	let state: MediaTransportState = 'idle';
	const events: MediaTransportEvent[] = [];
	const frameHandlers = new Set<
		(frame: MediaFrame) => Promise<void> | void
	>();

	const record = (
		event: Omit<MediaTransportEvent, 'at' | 'state'>
	) => {
		events.push({ ...event, at: Date.now(), state });
	};

	return {
		close: async () => {
			state = 'closing';
			await options.onClose?.();
			state = 'closed';
			record({ kind: 'close' });
		},
		connect: async () => {
			try {
				await options.onConnect?.();
				state = 'open';
				record({ kind: 'connect' });
			} catch (error) {
				state = 'failed';
				record({
					error: error instanceof Error ? error.message : String(error),
					kind: 'error'
				});
				throw error;
			}
		},
		events: () => [...events],
		inputFormat: options.inputFormat,
		name: options.name,
		onFrame: (handler) => {
			frameHandlers.add(handler);
			return () => frameHandlers.delete(handler);
		},
		outputFormat: options.outputFormat,
		receive: async (frame) => {
			record({ frameId: frame.id, kind: 'frame-in' });
			if (
				options.maxBufferedFrames !== undefined &&
				events.filter((event) => event.kind === 'frame-in').length >
					options.maxBufferedFrames
			) {
				record({
					bufferedFrames: events.filter((event) => event.kind === 'frame-in')
						.length,
					kind: 'backpressure'
				});
			}
			for (const handler of frameHandlers) {
				await handler(frame);
			}
		},
		report: () =>
			buildMediaTransportReport({
				events,
				name: options.name,
				state
			}),
		send: async (frame) => {
			try {
				await options.onSend?.(frame);
				record({ frameId: frame.id, kind: 'frame-out' });
			} catch (error) {
				state = 'failed';
				record({
					error: error instanceof Error ? error.message : String(error),
					frameId: frame.id,
					kind: 'error'
				});
				throw error;
			}
		},
		state: () => state
	};
};

export const buildMediaResamplingPlan = (input: {
	inputFormat: AudioFormat;
	outputFormat: AudioFormat;
}): MediaResamplingPlan => {
	const required = !formatMatches(input.inputFormat, input.outputFormat);

	return {
		inputFormat: input.inputFormat,
		outputFormat: input.outputFormat,
		ratio: input.outputFormat.sampleRateHz / input.inputFormat.sampleRateHz,
		required,
		status:
			input.inputFormat.container === input.outputFormat.container &&
			input.inputFormat.encoding === input.outputFormat.encoding &&
			input.inputFormat.channels === input.outputFormat.channels
				? 'pass'
				: 'warn'
	};
};

export const createMediaFrameTransformPipeline = (input: {
	transforms?: readonly MediaFrameTransform[];
} = {}): MediaFrameTransformPipeline => {
	const transforms = input.transforms ?? [];
	const push = async (frame: MediaFrame) => {
		let frames: readonly MediaFrame[] = [frame];

		for (const transform of transforms) {
			const nextFrames: MediaFrame[] = [];
			for (const current of frames) {
				const transformed = await transform.transform(current);
				if (transformed === undefined) {
					continue;
				}
				if (Array.isArray(transformed)) {
					nextFrames.push(...transformed);
				} else {
					nextFrames.push(transformed as MediaFrame);
				}
			}
			frames = nextFrames;
		}

		return frames;
	};

	return {
		push,
		pushMany: async (frames: readonly MediaFrame[]) => {
			const output: MediaFrame[] = [];
			for (const frame of frames) {
				output.push(...(await push(frame)));
			}
			return output;
		},
		transforms
	};
};

const normalizeProcessorResult = (
	frame: MediaFrame,
	result:
		| boolean
		| MediaFrame
		| readonly MediaFrame[]
		| undefined
): readonly MediaFrame[] => {
	if (result === false || result === undefined) {
		return [];
	}
	if (result === true) {
		return [frame];
	}
	if (Array.isArray(result)) {
		return result;
	}
	return [result as MediaFrame];
};

export const buildMediaProcessorGraphReport = (input: {
	events?: readonly MediaProcessorNodeEvent[];
	name: string;
	nodes: readonly MediaProcessorNode[];
}): MediaProcessorGraphReport => {
	const events = input.events ?? [];
	const nodes = input.nodes.map((node) => {
		const nodeEvents = events.filter((event) => event.node === node.name);
		const droppedFrames = nodeEvents.reduce(
			(total, event) => total + event.dropped,
			0
		);
		const emittedFrames = nodeEvents.reduce(
			(total, event) => total + event.emitted,
			0
		);
		const inputFrames = nodeEvents.reduce(
			(total, event) => total + event.inputs,
			0
		);

		return {
			droppedFrames,
			emittedFrames,
			events: nodeEvents,
			inputFrames,
			kind: node.kind ?? 'processor',
			name: node.name,
			status:
				inputFrames > 0 && emittedFrames === 0 && node.kind !== 'sink'
					? 'warn'
					: 'pass'
		} satisfies MediaProcessorNodeReport;
	});
	const inputFrames = events.filter(
		(event) => event.node === input.nodes[0]?.name
	).length;
	const droppedFrames = events.reduce(
		(total, event) => total + event.dropped,
		0
	);
	const emittedFrames = input.nodes.at(-1)
		? events
				.filter((event) => event.node === input.nodes.at(-1)?.name)
				.reduce((total, event) => total + event.emitted, 0)
		: 0;
	const status = nodes.some((node) => node.status === 'warn') ? 'warn' : 'pass';

	return {
		checkedAt: Date.now(),
		droppedFrames,
		emittedFrames,
		events,
		inputFrames,
		name: input.name,
		nodes,
		status
	};
};

export const createMediaProcessorGraph = (input: {
	name?: string;
	nodes?: readonly MediaProcessorNode[];
} = {}): MediaProcessorGraph => {
	const nodes = input.nodes ?? [];
	const events: MediaProcessorNodeEvent[] = [];

	const process = async (frame: MediaFrame) => {
		let frames: readonly MediaFrame[] = [frame];

		for (const node of nodes) {
			const nextFrames: MediaFrame[] = [];
			for (const current of frames) {
				const output = normalizeProcessorResult(
					current,
					await node.process(current)
				);
				events.push({
					at: Date.now(),
					dropped: output.length === 0 ? 1 : 0,
					emitted: output.length,
					frameId: current.id,
					inputs: 1,
					node: node.name
				});
				nextFrames.push(...output);
			}
			frames = nextFrames;
			if (frames.length === 0) {
				break;
			}
		}

		return frames;
	};

	return {
		nodes,
		process,
		processMany: async (frames) => {
			const output: MediaFrame[] = [];
			for (const frame of frames) {
				output.push(...(await process(frame)));
			}
			return output;
		},
		report: () =>
			buildMediaProcessorGraphReport({
				events,
				name: input.name ?? 'media-processor-graph',
				nodes
			})
	};
};

const speechProbability = (frame: MediaFrame): number => {
	if (frame.metadata?.isSpeech === true) {
		return 1;
	}
	if (frame.metadata?.isSpeech === false) {
		return 0;
	}

	for (const key of ['speechProbability', 'voiceProbability', 'rms', 'energy']) {
		const value = numericMetadata(frame, key);
		if (value !== undefined) {
			return value;
		}
	}

	return 0;
};

export const buildMediaVadReport = (
	input: MediaVadInput = {}
): MediaVadReport => {
	const frames = (input.frames ?? []).filter(
		(frame) => frame.kind === 'input-audio'
	);
	const speechStartThreshold = input.speechStartThreshold ?? 0.6;
	const speechEndThreshold = input.speechEndThreshold ?? 0.35;
	const minSpeechFrames = input.minSpeechFrames ?? 1;
	const maxSilenceFrames = input.maxSilenceFrames ?? 1;
	const segments: MediaVadSegment[] = [];
	let activeFrames: MediaFrame[] = [];
	let silenceFrames = 0;

	const closeSegment = () => {
		if (activeFrames.length < minSpeechFrames) {
			activeFrames = [];
			silenceFrames = 0;
			return;
		}
		const first = activeFrames[0];
		const last = activeFrames.at(-1);
		if (!first) {
			return;
		}
		segments.push({
			durationMs:
				first.at !== undefined && last?.at !== undefined
					? last.at - first.at + (last.durationMs ?? 0)
					: undefined,
			endAt:
				last?.at !== undefined ? last.at + (last.durationMs ?? 0) : undefined,
			frameCount: activeFrames.length,
			segmentId: `vad:${String(segments.length + 1)}`,
			sessionId: first.sessionId,
			startAt: first.at,
			turnId: first.turnId
		});
		activeFrames = [];
		silenceFrames = 0;
	};

	for (const frame of frames) {
		const probability = speechProbability(frame);
		if (activeFrames.length === 0) {
			if (probability >= speechStartThreshold) {
				activeFrames.push(frame);
			}
			continue;
		}

		activeFrames.push(frame);
		if (probability <= speechEndThreshold) {
			silenceFrames += 1;
		} else {
			silenceFrames = 0;
		}
		if (silenceFrames > maxSilenceFrames) {
			closeSegment();
		}
	}
	closeSegment();

	return {
		checkedAt: Date.now(),
		inputAudioFrames: frames.length,
		segments,
		status: frames.length === 0 ? 'warn' : 'pass'
	};
};

export const buildMediaInterruptionReport = (
	input: MediaInterruptionInput = {}
): MediaInterruptionReport => {
	const issues: MediaPipelineCalibrationIssue[] = [];
	const interruptionFrames = (input.frames ?? []).filter(
		(frame) => frame.kind === 'interruption'
	);
	const latenciesMs = interruptionFrames
		.map((frame) => frame.latencyMs)
		.filter((latency): latency is number => typeof latency === 'number');
	const maxInterruptionLatencyMs = input.maxInterruptionLatencyMs;

	if (interruptionFrames.length === 0) {
		pushIssue(
			issues,
			'warning',
			'media.interruption_missing',
			'No interruption frame was observed.'
		);
	}
	if (
		maxInterruptionLatencyMs !== undefined &&
		latenciesMs.some((latency) => latency > maxInterruptionLatencyMs)
	) {
		pushIssue(
			issues,
			'error',
			'media.interruption_latency',
			`Interruption latency exceeded ${String(maxInterruptionLatencyMs)}ms.`
		);
	}

	return {
		checkedAt: Date.now(),
		interruptionFrames: interruptionFrames.length,
		issues,
		latenciesMs,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass'
	};
};

export const buildMediaPipelineCalibrationReport = (
	input: MediaPipelineCalibrationInput = {}
): MediaPipelineCalibrationReport => {
	const frames = input.frames ?? [];
	const issues: MediaPipelineCalibrationIssue[] = [];
	const inputFrames = frames.filter((frame) => frame.kind === 'input-audio');
	const assistantFrames = frames.filter(
		(frame) => frame.kind === 'assistant-audio'
	);
	const turnCommitFrames = frames.filter((frame) => frame.kind === 'turn-commit');
	const interruptionFrameRecords = frames.filter(
		(frame) => frame.kind === 'interruption'
	);
	const traceLinkedFrames = frames.filter((frame) => frame.traceEventId).length;
	const backpressureFrames = frames.filter((frame) =>
		Boolean(frame.metadata?.backpressure)
	).length;
	const audioLatencies = assistantFrames
		.map((frame) => frame.latencyMs)
		.filter((latency): latency is number => typeof latency === 'number');
	const firstAudioLatencyMs =
		audioLatencies.length > 0 ? Math.min(...audioLatencies) : undefined;
	const jitterValues = frames
		.map((frame) => numericMetadata(frame, 'jitterMs'))
		.filter((value): value is number => value !== undefined);
	const jitterMs = jitterValues.length > 0 ? Math.max(...jitterValues) : undefined;
	const inputFormat = input.inputFormat ?? inputFrames.find((frame) => frame.format)?.format;
	const outputFormat =
		input.outputFormat ?? assistantFrames.find((frame) => frame.format)?.format;
	const resamplingRequired =
		Boolean(
			input.expectedInputFormat &&
				inputFormat &&
				inputFormat.sampleRateHz !== input.expectedInputFormat.sampleRateHz
		) ||
		Boolean(
			input.expectedOutputFormat &&
				outputFormat &&
				outputFormat.sampleRateHz !== input.expectedOutputFormat.sampleRateHz
		);
	const resamplingTargetHz =
		resamplingRequired && input.expectedInputFormat
			? input.expectedInputFormat.sampleRateHz
			: resamplingRequired
				? input.expectedOutputFormat?.sampleRateHz
				: undefined;

	if (inputFrames.length === 0) {
		pushIssue(
			issues,
			'warning',
			'media.input_audio_missing',
			'No input audio frames were observed.'
		);
	}
	if (assistantFrames.length === 0) {
		pushIssue(
			issues,
			'warning',
			'media.assistant_audio_missing',
			'No assistant audio frames were observed.'
		);
	}
	if (
		input.expectedInputFormat &&
		inputFormat &&
		!formatMatches(inputFormat, input.expectedInputFormat)
	) {
		pushIssue(
			issues,
			inputFormat.sampleRateHz === input.expectedInputFormat.sampleRateHz
				? 'warning'
				: 'error',
			'media.input_format_mismatch',
			`Input format ${formatLabel(inputFormat)} does not match expected ${formatLabel(input.expectedInputFormat)}.`
		);
	}
	if (
		input.expectedOutputFormat &&
		outputFormat &&
		!formatMatches(outputFormat, input.expectedOutputFormat)
	) {
		pushIssue(
			issues,
			outputFormat.sampleRateHz === input.expectedOutputFormat.sampleRateHz
				? 'warning'
				: 'error',
			'media.output_format_mismatch',
			`Output format ${formatLabel(outputFormat)} does not match expected ${formatLabel(input.expectedOutputFormat)}.`
		);
	}
	if (
		firstAudioLatencyMs !== undefined &&
		input.maxFirstAudioLatencyMs !== undefined &&
		firstAudioLatencyMs > input.maxFirstAudioLatencyMs
	) {
		pushIssue(
			issues,
			'error',
			'media.first_audio_latency',
			`First audio latency ${String(firstAudioLatencyMs)}ms exceeds budget ${String(input.maxFirstAudioLatencyMs)}ms.`
		);
	}
	if (
		jitterMs !== undefined &&
		input.maxJitterMs !== undefined &&
		jitterMs > input.maxJitterMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.jitter',
			`Media jitter ${String(jitterMs)}ms exceeds budget ${String(input.maxJitterMs)}ms.`
		);
	}
	if (
		input.maxBackpressureFrames !== undefined &&
		backpressureFrames > input.maxBackpressureFrames
	) {
		pushIssue(
			issues,
			'warning',
			'media.backpressure',
			`Backpressure frame count ${String(backpressureFrames)} exceeds budget ${String(input.maxBackpressureFrames)}.`
		);
	}
	if (input.requireInterruptionFrame && interruptionFrameRecords.length === 0) {
		pushIssue(
			issues,
			'warning',
			'media.interruption_missing',
			'No interruption frame was observed.'
		);
	}
	if (input.requireTraceEvidence && traceLinkedFrames === 0) {
		pushIssue(
			issues,
			'warning',
			'media.trace_evidence_missing',
			'No media frames were linked to trace evidence.'
		);
	}

	return {
		assistantAudioFrames: assistantFrames.length,
		backpressureFrames,
		checkedAt: Date.now(),
		firstAudioLatencyMs,
		inputAudioFrames: inputFrames.length,
		inputFormat,
		interruptionFrames: interruptionFrameRecords.length,
		issues,
		jitterMs,
		outputFormat,
		resamplingRequired,
		resamplingTargetHz,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass',
		surface: input.surface ?? 'media-pipeline',
		traceLinkedFrames,
		turnCommitFrames: turnCommitFrames.length
	};
};
