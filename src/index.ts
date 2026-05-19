import type { AudioFormat } from './types';

export {
	applyAudioRedaction,
	mergeAudioRedactionRanges
} from './audioRedaction';
export type {
	AudioRedactionFill,
	AudioRedactionOptions,
	AudioRedactionRange
} from './audioRedaction';
export {
	composeNoiseSuppressors,
	createEnergyGateNoiseSuppressor,
	createPassThroughNoiseSuppressor
} from './noiseSuppression';
export type {
	ComposeNoiseSuppressorsOptions,
	EnergyGateNoiseSuppressorOptions,
	NoiseSuppressor,
	NoiseSuppressorInput,
	NoiseSuppressorOutput
} from './noiseSuppression';

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

export type MediaProcessorGraphState =
	| 'closed'
	| 'draining'
	| 'failed'
	| 'idle'
	| 'running';

export type MediaProcessorGraphLifecycleEventKind =
	| 'backpressure'
	| 'close'
	| 'drain'
	| 'error'
	| 'node-error'
	| 'process'
	| 'start';

export type MediaProcessorGraphLifecycleEvent = {
	at: number;
	dropped?: number;
	emitted?: number;
	error?: string;
	frameId?: string;
	inputs?: number;
	kind: MediaProcessorGraphLifecycleEventKind;
	node?: string;
	state: MediaProcessorGraphState;
};

export type MediaProcessorEdgeEvent = {
	at: number;
	dropped: number;
	emitted: number;
	frameId: string;
	from: string;
	label?: string;
	outputFrameId?: string;
	outputFrameIds: readonly string[];
	to: string;
};

export type MediaProcessorEdgeReport = {
	droppedFrames: number;
	emittedFrames: number;
	events: readonly MediaProcessorEdgeEvent[];
	from: string;
	label?: string;
	outputFrames: readonly string[];
	status: MediaPipelineStatus;
	to: string;
};

export type MediaProcessorBackpressureStrategy = 'drop' | 'queue' | 'reject';

export type MediaProcessorBackpressureEventKind =
	| 'complete'
	| 'drop'
	| 'queue'
	| 'reject'
	| 'start';

export type MediaProcessorBackpressureEvent = {
	at: number;
	frameId: string;
	inFlight: number;
	kind: MediaProcessorBackpressureEventKind;
	maxInFlightFrames: number;
	maxQueuedFrames: number;
	queued: number;
};

export type MediaProcessorBackpressureReport = {
	completedFrames: number;
	droppedFrames: number;
	events: readonly MediaProcessorBackpressureEvent[];
	maxInFlightFrames: number;
	maxObservedInFlight: number;
	maxObservedQueued: number;
	maxQueuedFrames: number;
	queuedFrames: number;
	rejectedFrames: number;
	status: MediaPipelineStatus;
};

export type MediaProcessorTimingEvent = {
	at: number;
	durationMs: number;
	frameId: string;
	node: string;
};

export type MediaProcessorNodeTimingReport = {
	averageMs: number;
	events: readonly MediaProcessorTimingEvent[];
	maxMs: number;
	node: string;
	overBudgetFrames: number;
	status: MediaPipelineStatus;
	totalMs: number;
};

export type MediaProcessorTimingReport = {
	averageNodeMs: number;
	events: readonly MediaProcessorTimingEvent[];
	maxNodeMs: number;
	maxNodeProcessingMs: number;
	nodes: readonly MediaProcessorNodeTimingReport[];
	overBudgetFrames: number;
	status: MediaPipelineStatus;
	totalNodeMs: number;
};

export type MediaProcessorGraphSnapshotNode = {
	inputFormat?: AudioFormat;
	kind: MediaProcessorNodeKind;
	name: string;
	outputFormat?: AudioFormat;
};

export type MediaProcessorGraphSnapshotLimits = {
	maxInFlightFrames: number;
	maxNodeProcessingMs: number;
	maxQueuedFrames: number;
};

export type MediaProcessorGraphSnapshot = {
	capturedAt: number;
	limits: MediaProcessorGraphSnapshotLimits;
	name: string;
	nodes: readonly MediaProcessorGraphSnapshotNode[];
	report: MediaProcessorGraphReport;
	schema: 'absolute.media.processor-graph.snapshot.v1';
};

export type MediaProcessorBranchMode = 'all' | 'first';

export type MediaProcessorBranchRoute = {
	label?: string;
	name: string;
	process?: MediaProcessorNode['process'];
	when?: (frame: MediaFrame) => boolean | Promise<boolean>;
};

export type MediaProcessorBranchReport = {
	branch: string;
	droppedFrames: number;
	emittedFrames: number;
	inputFrames: number;
	node: string;
	outputFrames: readonly string[];
	status: MediaPipelineStatus;
};

export type MediaProcessorFanInStatus = 'complete' | 'partial';

export type MediaProcessorFanInJoinInput = {
	branches: readonly string[];
	frames: readonly MediaFrame[];
	missingBranches: readonly string[];
	sourceFrameId: string;
	status: MediaProcessorFanInStatus;
};

export type MediaProcessorFanInJoin = (
	input: MediaProcessorFanInJoinInput
) =>
	| MediaFrame
	| readonly MediaFrame[]
	| undefined
	| Promise<MediaFrame | readonly MediaFrame[] | undefined>;

export type MediaProcessorFanInReport = {
	completeGroups: number;
	emittedFrames: number;
	missingBranches: readonly string[];
	node: string;
	partialGroups: number;
	pendingGroups: number;
	status: MediaPipelineStatus;
};

export type MediaProcessorNodeReport = {
	droppedFrames: number;
	emittedFrames: number;
	errors: readonly MediaProcessorGraphLifecycleEvent[];
	events: readonly MediaProcessorNodeEvent[];
	inputFrames: number;
	kind: MediaProcessorNodeKind;
	name: string;
	status: MediaPipelineStatus;
};

export type MediaProcessorGraphReport = {
	backpressure: MediaProcessorBackpressureReport;
	backpressureEvents: readonly MediaProcessorBackpressureEvent[];
	checkedAt: number;
	droppedFrames: number;
	edges: readonly MediaProcessorEdgeReport[];
	emittedFrames: number;
	errors: readonly MediaProcessorGraphLifecycleEvent[];
	edgeEvents: readonly MediaProcessorEdgeEvent[];
	events: readonly MediaProcessorNodeEvent[];
	inputFrames: number;
	lifecycleEvents: readonly MediaProcessorGraphLifecycleEvent[];
	name: string;
	nodes: readonly MediaProcessorNodeReport[];
	state: MediaProcessorGraphState;
	status: MediaPipelineStatus;
	timing: MediaProcessorTimingReport;
	timingEvents: readonly MediaProcessorTimingEvent[];
};

export type MediaProcessorNode = {
	inputFormat?: AudioFormat;
	kind?: MediaProcessorNodeKind;
	name: string;
	outputFormat?: AudioFormat;
	edgeLabel?:
		| string
		| ((
				input: MediaFrame,
				output: readonly MediaFrame[],
				outputFrame?: MediaFrame
		  ) => string | undefined);
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
	flush?: () =>
		| MediaFrame
		| readonly MediaFrame[]
		| undefined
		| Promise<MediaFrame | readonly MediaFrame[] | undefined>;
};

export type MediaProcessorGraph = {
	close: () => Promise<void>;
	drain: () => Promise<readonly MediaFrame[]>;
	edgeEvents: () => readonly MediaProcessorEdgeEvent[];
	events: () => readonly MediaProcessorGraphLifecycleEvent[];
	nodes: readonly MediaProcessorNode[];
	process: (
		frame: MediaFrame
	) => Promise<readonly MediaFrame[]>;
	processMany: (
		frames: readonly MediaFrame[]
	) => Promise<readonly MediaFrame[]>;
	report: () => MediaProcessorGraphReport;
	snapshot: () => MediaProcessorGraphSnapshot;
	state: () => MediaProcessorGraphState;
	timingEvents: () => readonly MediaProcessorTimingEvent[];
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

export type MediaTelephonyCarrier = 'plivo' | 'telnyx' | 'twilio';

export type MediaTelephonyEnvelope = Record<string, unknown>;

export type MediaTelephonyFrameDirection = 'inbound' | 'outbound' | 'unknown';

export type MediaTelephonyParseInput = {
	carrier?: MediaTelephonyCarrier | (string & {});
	envelope: MediaTelephonyEnvelope;
	format?: AudioFormat;
	sessionId?: string;
};

export type MediaTelephonySerializeInput = {
	carrier?: MediaTelephonyCarrier | (string & {});
	frame: MediaFrame;
	sequenceNumber?: number | string;
	streamId?: string;
};

export type MediaTelephonySerializer = {
	carrier: MediaTelephonyCarrier | (string & {});
	format: AudioFormat;
	parse: (envelope: MediaTelephonyEnvelope) => MediaFrame | undefined;
	serialize: (frame: MediaFrame) => MediaTelephonyEnvelope;
};

export type MediaTelephonyStreamEventKind =
	| 'connected'
	| 'error'
	| 'media'
	| 'start'
	| 'stop'
	| 'unknown';

export type MediaTelephonyStreamEvent = {
	audioBytes: number;
	at?: number;
	carrier: MediaTelephonyCarrier | (string & {});
	direction: MediaTelephonyFrameDirection;
	error?: string;
	kind: MediaTelephonyStreamEventKind;
	sequenceNumber?: number | string;
	streamId?: string;
};

export type MediaTelephonyStreamLifecycleInput = {
	carrier?: MediaTelephonyCarrier | (string & {});
	envelopes?: readonly MediaTelephonyEnvelope[];
	maxMissingStop?: boolean;
	minAudioBytes?: number;
	requireMedia?: boolean;
	requireStart?: boolean;
	requireStop?: boolean;
};

export type MediaTelephonyStreamLifecycleReport = {
	audioBytes: number;
	carrier?: MediaTelephonyCarrier | (string & {});
	checkedAt: number;
	events: readonly MediaTelephonyStreamEvent[];
	issues: MediaPipelineCalibrationIssue[];
	mediaEvents: number;
	started: boolean;
	status: MediaPipelineStatus;
	stopped: boolean;
	streamIds: readonly string[];
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

export type MediaQualityInput = {
	frames?: readonly MediaFrame[];
	maxBackpressureEvents?: number;
	maxGapMs?: number;
	maxJitterMs?: number;
	maxTimestampDriftMs?: number;
	minSpeechRatio?: number;
	transport?: MediaTransportReport;
};

export type MediaQualityReport = {
	assistantAudioFrames: number;
	backpressureEvents: number;
	checkedAt: number;
	durationMs?: number;
	gapCount: number;
	gapsMs: number[];
	inputAudioFrames: number;
	issues: MediaPipelineCalibrationIssue[];
	jitterMs?: number;
	levelAverage?: number;
	levelMax?: number;
	levelMin?: number;
	silenceFrames: number;
	silenceRatio: number;
	speechFrames: number;
	speechRatio: number;
	status: MediaPipelineStatus;
	timestampDriftMs?: number;
	totalFrames: number;
	unknownSpeechFrames: number;
};

export type MediaWebRTCStatsSample = {
	id?: string;
	kind?: string;
	[key: string]: unknown;
	timestamp?: number;
	type?: string;
};

export type MediaWebRTCStatsInput = {
	maxJitterMs?: number;
	maxPacketLossRatio?: number;
	maxRoundTripTimeMs?: number;
	requireConnectedCandidatePair?: boolean;
	requireLiveAudioTrack?: boolean;
	stats?: readonly MediaWebRTCStatsSample[];
};

export type MediaWebRTCStatsCollector = {
	getStats: (
		selector?: MediaStreamTrack | null
	) => Promise<RTCStatsReport> | RTCStatsReport;
};

export type MediaWebRTCStatsCollectionInput = {
	peerConnection: MediaWebRTCStatsCollector;
	selector?: MediaStreamTrack | null;
};

export type MediaWebRTCStatsReportInput = Omit<
	MediaWebRTCStatsInput,
	'stats'
> &
	MediaWebRTCStatsCollectionInput;

export type MediaWebRTCStatsReport = {
	activeCandidatePairs: number;
	audioLevelAverage?: number;
	bytesReceived: number;
	bytesSent: number;
	checkedAt: number;
	endedAudioTracks: number;
	inboundPackets: number;
	issues: MediaPipelineCalibrationIssue[];
	jitterBufferDelayMs?: number;
	jitterMs?: number;
	liveAudioTracks: number;
	outboundPackets: number;
	packetLossRatio: number;
	packetsLost: number;
	roundTripTimeMs?: number;
	status: MediaPipelineStatus;
	totalStats: number;
};

export type MediaWebRTCStreamContinuityInput = {
	maxGapMs?: number;
	maxInboundPacketStallMs?: number;
	maxOutboundPacketStallMs?: number;
	previousStats?: readonly MediaWebRTCStatsSample[];
	requireInboundAudio?: boolean;
	requireOutboundAudio?: boolean;
	stats?: readonly MediaWebRTCStatsSample[];
};

export type MediaWebRTCStreamContinuityStream = {
	bytesDelta?: number;
	currentPackets?: number;
	direction: 'inbound' | 'outbound';
	id: string;
	packetDelta?: number;
	previousPackets?: number;
	timeDeltaMs?: number;
};

export type MediaWebRTCStreamContinuityReport = {
	checkedAt: number;
	inboundAudioStreams: number;
	issues: MediaPipelineCalibrationIssue[];
	maxObservedGapMs?: number;
	outboundAudioStreams: number;
	stalledInboundStreams: number;
	stalledOutboundStreams: number;
	status: MediaPipelineStatus;
	streams: readonly MediaWebRTCStreamContinuityStream[];
	totalStats: number;
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

const average = (values: readonly number[]): number | undefined =>
	values.length === 0
		? undefined
		: values.reduce((total, value) => total + value, 0) / values.length;

const sorted = (values: readonly number[]) => [...values].sort((a, b) => a - b);

const max = (values: readonly number[]): number | undefined =>
	values.length === 0 ? undefined : Math.max(...values);

const min = (values: readonly number[]): number | undefined =>
	values.length === 0 ? undefined : Math.min(...values);

const numericStat = (
	stat: MediaWebRTCStatsSample,
	key: string
): number | undefined => {
	const value = stat[key];
	return typeof value === 'number' && Number.isFinite(value) ? value : undefined;
};

const booleanStat = (
	stat: MediaWebRTCStatsSample,
	key: string
): boolean | undefined => {
	const value = stat[key];
	return typeof value === 'boolean' ? value : undefined;
};

const stringStat = (
	stat: MediaWebRTCStatsSample,
	key: string
): string | undefined => {
	const value = stat[key];
	return typeof value === 'string' ? value : undefined;
};

const statKey = (stat: MediaWebRTCStatsSample): string =>
	String(
		stat.id ??
			stringStat(stat, 'ssrc') ??
			numericStat(stat, 'ssrc') ??
			stringStat(stat, 'trackIdentifier') ??
			stringStat(stat, 'mid') ??
			'unknown'
	);

const secondsToMs = (value: number | undefined): number | undefined =>
	value === undefined ? undefined : value * 1000;

const DEFAULT_TELEPHONY_FORMAT: AudioFormat = {
	channels: 1,
	container: 'raw',
	encoding: 'mulaw',
	sampleRateHz: 8000
};

const bytesToBase64 = (audio: ArrayBuffer | ArrayBufferView): string => {
	const bytes =
		audio instanceof ArrayBuffer
			? new Uint8Array(audio)
			: new Uint8Array(audio.buffer, audio.byteOffset, audio.byteLength);

	return Buffer.from(bytes).toString('base64');
};

const base64ToBytes = (value: string): Uint8Array =>
	new Uint8Array(Buffer.from(value, 'base64'));

const unknownRecord = (value: unknown): Record<string, unknown> =>
	value && typeof value === 'object' ? (value as Record<string, unknown>) : {};

const firstString = (
	records: readonly Record<string, unknown>[],
	keys: readonly string[]
): string | undefined => {
	for (const record of records) {
		for (const key of keys) {
			const value = record[key];
			if (typeof value === 'string' && value.length > 0) {
				return value;
			}
			if (typeof value === 'number' && Number.isFinite(value)) {
				return String(value);
			}
		}
	}

	return undefined;
};

const firstNumber = (
	records: readonly Record<string, unknown>[],
	keys: readonly string[]
): number | undefined => {
	for (const record of records) {
		for (const key of keys) {
			const value = record[key];
			if (typeof value === 'number' && Number.isFinite(value)) {
				return value;
			}
			if (typeof value === 'string') {
				const parsed = Number(value);
				if (Number.isFinite(parsed)) {
					return parsed;
				}
			}
		}
	}

	return undefined;
};

const telephonyDirection = (
	track: string | undefined
): MediaTelephonyFrameDirection => {
	const normalized = track?.toLowerCase();
	if (!normalized) {
		return 'unknown';
	}
	if (
		normalized.includes('inbound') ||
		normalized.includes('caller') ||
		normalized.includes('in')
	) {
		return 'inbound';
	}
	if (
		normalized.includes('outbound') ||
		normalized.includes('assistant') ||
		normalized.includes('out')
	) {
		return 'outbound';
	}

	return 'unknown';
};

const telephonyFrameKind = (
	direction: MediaTelephonyFrameDirection
): MediaFrameKind =>
	direction === 'outbound' ? 'assistant-audio' : 'input-audio';

const telephonyEventKind = (
	envelope: MediaTelephonyEnvelope
): MediaTelephonyStreamEventKind => {
	const raw =
		firstString([envelope], ['event', 'type', 'eventType']) ??
		firstString([unknownRecord(envelope.message)], ['event', 'type']);
	const normalized = raw?.toLowerCase().replace(/[_\s-]+/g, '-');

	if (!normalized) {
		return 'unknown';
	}
	if (normalized.includes('connected')) {
		return 'connected';
	}
	if (normalized.includes('start')) {
		return 'start';
	}
	if (normalized.includes('media')) {
		return 'media';
	}
	if (normalized.includes('stop') || normalized.includes('closed')) {
		return 'stop';
	}
	if (normalized.includes('error') || normalized.includes('failed')) {
		return 'error';
	}

	return 'unknown';
};

const normalizeWebRTCStat = (stat: RTCStats): MediaWebRTCStatsSample => {
	const sample: MediaWebRTCStatsSample = {};

	for (const [key, value] of Object.entries(
		stat as unknown as Record<string, unknown>
	)) {
		if (
			value === null ||
			typeof value === 'boolean' ||
			typeof value === 'number' ||
			typeof value === 'string'
		) {
			sample[key] = value;
		}
	}

	return sample;
};

export const createMediaFrame = (
	frame: MediaFrame
): MediaFrame => frame;

export const parseTelephonyMediaFrame = (
	input: MediaTelephonyParseInput
): MediaFrame | undefined => {
	const envelope = input.envelope;
	const media = unknownRecord(envelope.media);
	const payload =
		firstString([media, envelope], ['payload', 'audio', 'data']) ??
		firstString([unknownRecord(envelope.message)], ['payload']);

	if (!payload) {
		return undefined;
	}

	const carrier = input.carrier ?? firstString([envelope], ['provider']) ?? 'telephony';
	const streamId = firstString(
		[media, envelope],
		['streamSid', 'stream_id', 'streamId', 'streamId', 'callSid', 'call_id']
	);
	const sequenceNumber = firstString(
		[media, envelope],
		['sequenceNumber', 'sequence_number', 'chunk']
	);
	const track = firstString([media, envelope], ['track', 'direction']);
	const direction = telephonyDirection(track);
	const timestamp = firstNumber(
		[media, envelope],
		['timestamp', 'time', 'startedAt']
	);

	return {
		at: timestamp,
		audio: base64ToBytes(payload),
		format: input.format ?? DEFAULT_TELEPHONY_FORMAT,
		id: [
			carrier,
			streamId ?? input.sessionId ?? 'stream',
			sequenceNumber ?? timestamp ?? Date.now()
		].join(':'),
		kind: telephonyFrameKind(direction),
		metadata: {
			carrier,
			direction,
			event: firstString([envelope], ['event', 'type']),
			sequenceNumber,
			streamId,
			track
		},
		sessionId: input.sessionId ?? streamId,
		source: 'telephony'
	};
};

export const serializeTelephonyMediaFrame = (
	input: MediaTelephonySerializeInput
): MediaTelephonyEnvelope => {
	const carrier = input.carrier ?? input.frame.metadata?.carrier ?? 'telephony';
	const streamId =
		input.streamId ??
		(typeof input.frame.metadata?.streamId === 'string'
			? input.frame.metadata.streamId
			: input.frame.sessionId);
	const sequenceNumber =
		input.sequenceNumber ??
		(typeof input.frame.metadata?.sequenceNumber === 'string' ||
		typeof input.frame.metadata?.sequenceNumber === 'number'
			? input.frame.metadata.sequenceNumber
			: undefined);
	const direction =
		input.frame.kind === 'assistant-audio' ? 'outbound' : 'inbound';
	const payload = input.frame.audio ? bytesToBase64(input.frame.audio) : '';

	if (carrier === 'twilio') {
		return {
			event: 'media',
			sequenceNumber,
			streamSid: streamId,
			media: {
				payload,
				timestamp: input.frame.at,
				track: direction
			}
		};
	}

	if (carrier === 'telnyx') {
		return {
			event: 'media',
			stream_id: streamId,
			sequence_number: sequenceNumber,
			media: {
				payload,
				timestamp: input.frame.at,
				track: direction
			}
		};
	}

	if (carrier === 'plivo') {
		return {
			event: 'media',
			streamId,
			sequenceNumber,
			media: {
				payload,
				timestamp: input.frame.at,
				track: direction
			}
		};
	}

	return {
		event: 'media',
		provider: carrier,
		sequenceNumber,
		streamId,
		media: {
			payload,
			timestamp: input.frame.at,
			track: direction
		}
	};
};

export const createTelephonyMediaSerializer = (input: {
	carrier: MediaTelephonyCarrier | (string & {});
	format?: AudioFormat;
	sessionId?: string;
	streamId?: string;
}): MediaTelephonySerializer => {
	const format = input.format ?? DEFAULT_TELEPHONY_FORMAT;

	return {
		carrier: input.carrier,
		format,
		parse: (envelope) =>
			parseTelephonyMediaFrame({
				carrier: input.carrier,
				envelope,
				format,
				sessionId: input.sessionId ?? input.streamId
			}),
		serialize: (frame) =>
			serializeTelephonyMediaFrame({
				carrier: input.carrier,
				frame,
				streamId: input.streamId
			})
	};
};

export const parseTelephonyStreamEvent = (input: {
	carrier?: MediaTelephonyCarrier | (string & {});
	envelope: MediaTelephonyEnvelope;
	format?: AudioFormat;
	sessionId?: string;
}): MediaTelephonyStreamEvent => {
	const envelope = input.envelope;
	const media = unknownRecord(envelope.media);
	const start = unknownRecord(envelope.start);
	const stop = unknownRecord(envelope.stop);
	const errorRecord = unknownRecord(envelope.error);
	const kind = telephonyEventKind(envelope);
	const carrier =
		input.carrier ?? firstString([envelope], ['provider', 'carrier']) ?? 'telephony';
	const frame =
		kind === 'media'
			? parseTelephonyMediaFrame({
					carrier,
					envelope,
					format: input.format,
					sessionId: input.sessionId
				})
			: undefined;
	const streamId =
		firstString(
			[media, start, stop, envelope],
			['streamSid', 'stream_id', 'streamId', 'callSid', 'call_id']
		) ?? input.sessionId;
	const sequenceNumber = firstString(
		[media, envelope],
		['sequenceNumber', 'sequence_number', 'chunk']
	);
	const track = firstString([media, envelope], ['track', 'direction']);

	return {
		audioBytes: frame?.audio
			? frame.audio instanceof ArrayBuffer
				? frame.audio.byteLength
				: frame.audio.byteLength
			: 0,
		at:
			frame?.at ??
			firstNumber([media, start, stop, envelope], ['timestamp', 'time', 'startedAt']),
		carrier,
		direction: telephonyDirection(track),
		error: firstString([errorRecord, envelope], ['message', 'error', 'reason']),
		kind,
		sequenceNumber,
		streamId
	};
};

export const buildMediaTelephonyStreamLifecycleReport = (
	input: MediaTelephonyStreamLifecycleInput = {}
): MediaTelephonyStreamLifecycleReport => {
	const envelopes = input.envelopes ?? [];
	const events = envelopes.map((envelope) =>
		parseTelephonyStreamEvent({
			carrier: input.carrier,
			envelope
		})
	);
	const issues: MediaPipelineCalibrationIssue[] = [];
	const startedIndex = events.findIndex((event) => event.kind === 'start');
	const firstMediaIndex = events.findIndex((event) => event.kind === 'media');
	const stoppedIndex = events.findIndex((event) => event.kind === 'stop');
	const started = startedIndex >= 0;
	const stopped = stoppedIndex >= 0;
	const mediaEvents = events.filter((event) => event.kind === 'media');
	const audioBytes = events.reduce((total, event) => total + event.audioBytes, 0);
	const minAudioBytes = input.minAudioBytes ?? 1;
	const streamIds = Array.from(
		new Set(events.map((event) => event.streamId).filter(Boolean) as string[])
	);

	if ((input.requireStart ?? true) && !started) {
		pushIssue(
			issues,
			'error',
			'media.telephony_missing_start',
			'Telephony media stream did not include a start event.'
		);
	}
	if ((input.requireMedia ?? true) && mediaEvents.length === 0) {
		pushIssue(
			issues,
			'error',
			'media.telephony_missing_media',
			'Telephony media stream did not include media payload events.'
		);
	}
	if ((input.requireStop ?? true) && !stopped) {
		pushIssue(
			issues,
			input.maxMissingStop === false ? 'warning' : 'error',
			'media.telephony_missing_stop',
			'Telephony media stream did not include a stop event.'
		);
	}
	if (started && firstMediaIndex >= 0 && firstMediaIndex < startedIndex) {
		pushIssue(
			issues,
			'error',
			'media.telephony_media_before_start',
			'Telephony media payload arrived before the stream start event.'
		);
	}
	if (stopped && firstMediaIndex >= 0 && stoppedIndex < firstMediaIndex) {
		pushIssue(
			issues,
			'error',
			'media.telephony_stop_before_media',
			'Telephony media stream stopped before any media payload arrived.'
		);
	}
	if (mediaEvents.length > 0 && audioBytes < minAudioBytes) {
		pushIssue(
			issues,
			'error',
			'media.telephony_no_audio_bytes',
			`Telephony media stream parsed ${String(audioBytes)} audio byte(s), below required ${String(minAudioBytes)}.`
		);
	}
	for (const event of events) {
		if (event.kind === 'error') {
			pushIssue(
				issues,
				'error',
				'media.telephony_stream_error',
				event.error ?? 'Telephony media stream emitted an error event.'
			);
		}
	}

	return {
		audioBytes,
		carrier: input.carrier,
		checkedAt: Date.now(),
		events,
		issues,
		mediaEvents: mediaEvents.length,
		started,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass',
		stopped,
		streamIds
	};
};

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

const normalizeProcessorFlushResult = (
	result: MediaFrame | readonly MediaFrame[] | undefined
): readonly MediaFrame[] => {
	if (result === undefined) {
		return [];
	}
	if (Array.isArray(result)) {
		return result;
	}
	return [result as MediaFrame];
};

const getProcessorEdgeLabel = (
	node: MediaProcessorNode,
	input: MediaFrame,
	output: readonly MediaFrame[],
	outputFrame?: MediaFrame
): string | undefined => {
	if (typeof node.edgeLabel === 'function') {
		return node.edgeLabel(input, output, outputFrame);
	}
	return node.edgeLabel;
};

const buildMediaProcessorEdgeReports = (
	edgeEvents: readonly MediaProcessorEdgeEvent[]
): readonly MediaProcessorEdgeReport[] => {
	const edgeKeys = new Map<string, MediaProcessorEdgeEvent[]>();

	for (const event of edgeEvents) {
		const key = `${event.from}\u0000${event.to}\u0000${event.label ?? ''}`;
		const events = edgeKeys.get(key);
		if (events === undefined) {
			edgeKeys.set(key, [event]);
		} else {
			events.push(event);
		}
	}

	return Array.from(edgeKeys.values()).map((events) => {
		const first = events[0] as MediaProcessorEdgeEvent;
		const droppedFrames = events.reduce(
			(total, event) => total + event.dropped,
			0
		);
		const emittedFrames = events.reduce(
			(total, event) => total + event.emitted,
			0
		);
		const outputFrames = Array.from(
			new Set(events.flatMap((event) => event.outputFrameIds))
		);

		return {
			droppedFrames,
			emittedFrames,
			events,
			from: first.from,
			label: first.label,
			outputFrames,
			status:
				first.label === 'pending'
					? 'pass'
					: droppedFrames > 0 && emittedFrames === 0
						? 'warn'
						: 'pass',
			to: first.to
		} satisfies MediaProcessorEdgeReport;
	});
};

const buildMediaProcessorBackpressureReport = (input: {
	events?: readonly MediaProcessorBackpressureEvent[];
	maxInFlightFrames?: number;
	maxQueuedFrames?: number;
}): MediaProcessorBackpressureReport => {
	const events = input.events ?? [];
	const completedFrames = events.filter(
		(event) => event.kind === 'complete'
	).length;
	const droppedFrames = events.filter((event) => event.kind === 'drop').length;
	const queuedFrames = events.filter((event) => event.kind === 'queue').length;
	const rejectedFrames = events.filter(
		(event) => event.kind === 'reject'
	).length;
	const maxObservedInFlight = events.reduce(
		(max, event) => Math.max(max, event.inFlight),
		0
	);
	const maxObservedQueued = events.reduce(
		(max, event) => Math.max(max, event.queued),
		0
	);

	return {
		completedFrames,
		droppedFrames,
		events,
		maxInFlightFrames: input.maxInFlightFrames ?? Number.POSITIVE_INFINITY,
		maxObservedInFlight,
		maxObservedQueued,
		maxQueuedFrames: input.maxQueuedFrames ?? Number.POSITIVE_INFINITY,
		queuedFrames,
		rejectedFrames,
		status: droppedFrames > 0 || rejectedFrames > 0 ? 'warn' : 'pass'
	};
};

const buildMediaProcessorTimingReport = (input: {
	events?: readonly MediaProcessorTimingEvent[];
	maxNodeProcessingMs?: number;
	nodes: readonly MediaProcessorNode[];
}): MediaProcessorTimingReport => {
	const events = input.events ?? [];
	const maxNodeProcessingMs =
		input.maxNodeProcessingMs ?? Number.POSITIVE_INFINITY;
	const nodeReports = input.nodes.map((node) => {
		const nodeEvents = events.filter((event) => event.node === node.name);
		const totalMs = nodeEvents.reduce(
			(total, event) => total + event.durationMs,
			0
		);
		const maxMs = nodeEvents.reduce(
			(max, event) => Math.max(max, event.durationMs),
			0
		);
		const overBudgetFrames = nodeEvents.filter(
			(event) => event.durationMs > maxNodeProcessingMs
		).length;

		return {
			averageMs: nodeEvents.length > 0 ? totalMs / nodeEvents.length : 0,
			events: nodeEvents,
			maxMs,
			node: node.name,
			overBudgetFrames,
			status: overBudgetFrames > 0 ? 'warn' : 'pass',
			totalMs
		} satisfies MediaProcessorNodeTimingReport;
	});
	const totalNodeMs = events.reduce(
		(total, event) => total + event.durationMs,
		0
	);
	const maxNodeMs = events.reduce(
		(max, event) => Math.max(max, event.durationMs),
		0
	);
	const overBudgetFrames = nodeReports.reduce(
		(total, report) => total + report.overBudgetFrames,
		0
	);

	return {
		averageNodeMs: events.length > 0 ? totalNodeMs / events.length : 0,
		events,
		maxNodeMs,
		maxNodeProcessingMs,
		nodes: nodeReports,
		overBudgetFrames,
		status: overBudgetFrames > 0 ? 'warn' : 'pass',
		totalNodeMs
	};
};

export const buildMediaProcessorBranchReports = (input: {
	node: string;
	report: Pick<MediaProcessorGraphReport, 'edgeEvents'>;
}): readonly MediaProcessorBranchReport[] => {
	const branchEvents = input.report.edgeEvents.filter(
		(event) => event.from === input.node
	);
	const branches = new Map<string, MediaProcessorEdgeEvent[]>();

	for (const event of branchEvents) {
		const branch = event.label ?? 'default';
		const events = branches.get(branch);
		if (events === undefined) {
			branches.set(branch, [event]);
		} else {
			events.push(event);
		}
	}

	return Array.from(branches.entries()).map(([branch, events]) => {
		const droppedFrames = events.reduce(
			(total, event) => total + event.dropped,
			0
		);
		const emittedFrames = events.reduce(
			(total, event) => total + event.emitted,
			0
		);
		const outputFrames = Array.from(
			new Set(events.flatMap((event) => event.outputFrameIds))
		);

		return {
			branch,
			droppedFrames,
			emittedFrames,
			inputFrames: events.length,
			node: input.node,
			outputFrames,
			status: droppedFrames > 0 && emittedFrames === 0 ? 'warn' : 'pass'
		} satisfies MediaProcessorBranchReport;
	});
};

export const buildMediaProcessorFanInReport = (input: {
	node: string;
	report: Pick<MediaProcessorGraphReport, 'edgeEvents'>;
}): MediaProcessorFanInReport => {
	const events = input.report.edgeEvents.filter(
		(event) => event.from === input.node
	);
	const completeGroups = events.filter(
		(event) => event.label === 'complete'
	).length;
	const partialGroups = events.filter(
		(event) => event.label === 'partial'
	).length;
	const pendingGroups = events.filter(
		(event) => event.label === 'pending'
	).length;
	const emittedFrames = events.reduce(
		(total, event) => total + event.emitted,
		0
	);

	return {
		completeGroups,
		emittedFrames,
		missingBranches: [],
		node: input.node,
		partialGroups,
		pendingGroups,
		status: partialGroups > 0 ? 'warn' : 'pass'
	};
};

export const buildMediaProcessorGraphReport = (input: {
	backpressureEvents?: readonly MediaProcessorBackpressureEvent[];
	edgeEvents?: readonly MediaProcessorEdgeEvent[];
	events?: readonly MediaProcessorNodeEvent[];
	lifecycleEvents?: readonly MediaProcessorGraphLifecycleEvent[];
	maxInFlightFrames?: number;
	maxNodeProcessingMs?: number;
	maxQueuedFrames?: number;
	name: string;
	nodes: readonly MediaProcessorNode[];
	state?: MediaProcessorGraphState;
	timingEvents?: readonly MediaProcessorTimingEvent[];
}): MediaProcessorGraphReport => {
	const backpressureEvents = input.backpressureEvents ?? [];
	const backpressure = buildMediaProcessorBackpressureReport({
		events: backpressureEvents,
		maxInFlightFrames: input.maxInFlightFrames,
		maxQueuedFrames: input.maxQueuedFrames
	});
	const timingEvents = input.timingEvents ?? [];
	const timing = buildMediaProcessorTimingReport({
		events: timingEvents,
		maxNodeProcessingMs: input.maxNodeProcessingMs,
		nodes: input.nodes
	});
	const events = input.events ?? [];
	const edgeEvents = input.edgeEvents ?? [];
	const edges = buildMediaProcessorEdgeReports(edgeEvents);
	const lifecycleEvents = input.lifecycleEvents ?? [];
	const graphErrors = lifecycleEvents.filter(
		(event) => event.kind === 'error' || event.kind === 'node-error'
	);
	const nodes = input.nodes.map((node) => {
		const nodeEvents = events.filter((event) => event.node === node.name);
		const errors = graphErrors.filter((event) => event.node === node.name);
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
			errors,
			events: nodeEvents,
			inputFrames,
			kind: node.kind ?? 'processor',
			name: node.name,
			status:
				errors.length > 0
					? 'fail'
					: inputFrames > 0 && emittedFrames === 0 && node.kind !== 'sink'
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
	const state = input.state ?? 'idle';
	const graphStatus =
		state === 'failed' || graphErrors.length > 0
			? 'fail'
			: status === 'warn' ||
				  backpressure.status === 'warn' ||
				  timing.status === 'warn' ||
				  edges.some((edge) => edge.status === 'warn')
				? 'warn'
				: 'pass';

	return {
		backpressure,
		backpressureEvents,
		checkedAt: Date.now(),
		droppedFrames,
		edges,
		emittedFrames,
		errors: graphErrors,
		edgeEvents,
		events,
		inputFrames,
		lifecycleEvents,
		name: input.name,
		nodes,
		state,
		status: graphStatus,
		timing,
		timingEvents
	};
};

const buildMediaProcessorGraphSnapshotNodes = (
	nodes: readonly MediaProcessorNode[]
): readonly MediaProcessorGraphSnapshotNode[] =>
	nodes.map((node) => ({
		inputFormat: node.inputFormat,
		kind: node.kind ?? 'processor',
		name: node.name,
		outputFormat: node.outputFormat
	}));

export const buildMediaProcessorGraphSnapshot = (input: {
	limits?: Partial<MediaProcessorGraphSnapshotLimits>;
	name: string;
	nodes: readonly MediaProcessorNode[];
	report: MediaProcessorGraphReport;
}): MediaProcessorGraphSnapshot => ({
	capturedAt: Date.now(),
	limits: {
		maxInFlightFrames:
			input.limits?.maxInFlightFrames ?? Number.POSITIVE_INFINITY,
		maxNodeProcessingMs:
			input.limits?.maxNodeProcessingMs ?? Number.POSITIVE_INFINITY,
		maxQueuedFrames: input.limits?.maxQueuedFrames ?? Number.POSITIVE_INFINITY
	},
	name: input.name,
	nodes: buildMediaProcessorGraphSnapshotNodes(input.nodes),
	report: input.report,
	schema: 'absolute.media.processor-graph.snapshot.v1'
});

export const parseMediaProcessorGraphSnapshot = (
	snapshot: MediaProcessorGraphSnapshot
): MediaProcessorGraphSnapshot => {
	if (snapshot.schema !== 'absolute.media.processor-graph.snapshot.v1') {
		throw new Error('Unsupported media processor graph snapshot schema.');
	}
	return snapshot;
};

const annotateMediaProcessorBranchFrame = (
	frame: MediaFrame,
	route: MediaProcessorBranchRoute,
	sourceFrame: MediaFrame
): MediaFrame => ({
	...frame,
	metadata: {
		...frame.metadata,
		mediaBranch: route.label ?? route.name,
		mediaBranchRoute: route.name,
		mediaBranchSourceFrameId: sourceFrame.id
	}
});

export const createMediaProcessorBranchRouter = (input: {
	annotateFrames?: boolean;
	mode?: MediaProcessorBranchMode;
	name: string;
	passthroughUnmatched?: boolean;
	routes: readonly MediaProcessorBranchRoute[];
}): MediaProcessorNode => {
	const mode = input.mode ?? 'all';
	const annotateFrames = input.annotateFrames ?? true;

	return {
		edgeLabel: (_frame, output, outputFrame) => {
			if (output.length === 0) {
				return 'unmatched';
			}
			const branch = outputFrame?.metadata?.mediaBranch;
			return typeof branch === 'string' ? branch : undefined;
		},
		kind: 'branch',
		name: input.name,
		process: async (frame) => {
			const selectedRoutes: MediaProcessorBranchRoute[] = [];
			for (const route of input.routes) {
				const matches = route.when === undefined || (await route.when(frame));
				if (!matches) {
					continue;
				}
				selectedRoutes.push(route);
				if (mode === 'first') {
					break;
				}
			}

			if (selectedRoutes.length === 0) {
				return input.passthroughUnmatched === true ? frame : undefined;
			}

			const output: MediaFrame[] = [];
			for (const route of selectedRoutes) {
				const routeOutput = normalizeProcessorResult(
					frame,
					route.process === undefined
						? frame
						: await route.process(frame)
				);
				output.push(
					...(annotateFrames
						? routeOutput.map((routeFrame) =>
								annotateMediaProcessorBranchFrame(
									routeFrame,
									route,
									frame
								)
							)
						: routeOutput)
				);
			}
			return output;
		}
	};
};

const getMediaProcessorFrameBranch = (frame: MediaFrame): string | undefined => {
	const branch = frame.metadata?.mediaBranch ?? frame.metadata?.mediaBranchRoute;
	return typeof branch === 'string' ? branch : undefined;
};

const getMediaProcessorFrameSourceId = (frame: MediaFrame): string => {
	const sourceFrameId = frame.metadata?.mediaBranchSourceFrameId;
	return typeof sourceFrameId === 'string' ? sourceFrameId : frame.id;
};

const createDefaultMediaProcessorFanInFrame = (
	input: MediaProcessorFanInJoinInput
): MediaFrame =>
	createMediaFrame({
		id: `${input.sourceFrameId}:fan-in:${input.status}`,
		kind: 'metadata',
		metadata: {
			branches: input.branches,
			frameIds: input.frames.map((frame) => frame.id),
			missingBranches: input.missingBranches,
			sourceFrameId: input.sourceFrameId,
			status: input.status
		},
		source: 'voice-runtime'
	});

export const createMediaProcessorFanIn = (input: {
	branch?: (frame: MediaFrame) => string | undefined;
	dropUnbranchedFrames?: boolean;
	emitPartialOnTimeout?: boolean;
	expectedBranches: readonly string[];
	flushPartial?: boolean;
	join?: MediaProcessorFanInJoin;
	name: string;
	sourceFrameId?: (frame: MediaFrame) => string;
	timeoutMs?: number;
}): MediaProcessorNode => {
	type PendingFanInGroup = {
		branches: Map<string, MediaFrame[]>;
		createdAt: number;
		sourceFrameId: string;
	};

	const expectedBranches = Array.from(new Set(input.expectedBranches));
	const pendingGroups = new Map<string, PendingFanInGroup>();
	const join = input.join ?? createDefaultMediaProcessorFanInFrame;
	const emitPartialOnTimeout = input.emitPartialOnTimeout ?? true;
	const flushPartial = input.flushPartial ?? true;
	const dropUnbranchedFrames = input.dropUnbranchedFrames ?? true;

	const buildJoinInput = (
		group: PendingFanInGroup,
		status: MediaProcessorFanInStatus
	): MediaProcessorFanInJoinInput => {
		const frames = expectedBranches.flatMap(
			(branch) => group.branches.get(branch) ?? []
		);
		const missingBranches = expectedBranches.filter(
			(branch) => !group.branches.has(branch)
		);
		return {
			branches: expectedBranches,
			frames,
			missingBranches,
			sourceFrameId: group.sourceFrameId,
			status
		};
	};

	const emitGroup = async (
		group: PendingFanInGroup,
		status: MediaProcessorFanInStatus
	): Promise<readonly MediaFrame[]> => {
		const joinInput = buildJoinInput(group, status);
		return normalizeProcessorFlushResult(await join(joinInput)).map((frame) => ({
			...frame,
			metadata: {
				...frame.metadata,
				mediaFanInBranches: joinInput.branches,
				mediaFanInMissingBranches: joinInput.missingBranches,
				mediaFanInSourceFrameId: joinInput.sourceFrameId,
				mediaFanInStatus: status
			}
		}));
	};

	const emitTimedOutGroups = async (now: number): Promise<MediaFrame[]> => {
		if (input.timeoutMs === undefined || !emitPartialOnTimeout) {
			return [];
		}
		const output: MediaFrame[] = [];
		for (const group of Array.from(pendingGroups.values())) {
			if (now - group.createdAt < input.timeoutMs) {
				continue;
			}
			pendingGroups.delete(group.sourceFrameId);
			output.push(...(await emitGroup(group, 'partial')));
		}
		return output;
	};

	return {
		edgeLabel: (_frame, output, outputFrame) => {
			if (output.length === 0) {
				return 'pending';
			}
			const status = outputFrame?.metadata?.mediaFanInStatus;
			return status === 'complete' || status === 'partial'
				? status
				: 'joined';
		},
		flush: async () => {
			if (!flushPartial) {
				return [];
			}
			const output: MediaFrame[] = [];
			for (const group of Array.from(pendingGroups.values())) {
				pendingGroups.delete(group.sourceFrameId);
				output.push(...(await emitGroup(group, 'partial')));
			}
			return output;
		},
		kind: 'processor',
		name: input.name,
		process: async (frame) => {
			const now = Date.now();
			const output = await emitTimedOutGroups(now);
			const branch = input.branch?.(frame) ?? getMediaProcessorFrameBranch(frame);
			if (branch === undefined || !expectedBranches.includes(branch)) {
				return dropUnbranchedFrames ? output : [...output, frame];
			}

			const sourceFrameId =
				input.sourceFrameId?.(frame) ?? getMediaProcessorFrameSourceId(frame);
			const group =
				pendingGroups.get(sourceFrameId) ??
				({
					branches: new Map<string, MediaFrame[]>(),
					createdAt: now,
					sourceFrameId
				} satisfies PendingFanInGroup);
			const frames = group.branches.get(branch) ?? [];
			group.branches.set(branch, [...frames, frame]);
			pendingGroups.set(sourceFrameId, group);

			const hasAllBranches = expectedBranches.every((expected) =>
				group.branches.has(expected)
			);
			if (!hasAllBranches) {
				return output;
			}

			pendingGroups.delete(sourceFrameId);
			output.push(...(await emitGroup(group, 'complete')));
			return output;
		}
	};
};

export const createMediaProcessorGraph = (input: {
	backpressureStrategy?: MediaProcessorBackpressureStrategy;
	maxInFlightFrames?: number;
	maxNodeProcessingMs?: number;
	maxQueuedFrames?: number;
	name?: string;
	nodes?: readonly MediaProcessorNode[];
	queueOverflowStrategy?: Extract<
		MediaProcessorBackpressureStrategy,
		'drop' | 'reject'
	>;
} = {}): MediaProcessorGraph => {
	const nodes = input.nodes ?? [];
	const backpressureEvents: MediaProcessorBackpressureEvent[] = [];
	const events: MediaProcessorNodeEvent[] = [];
	const edgeEvents: MediaProcessorEdgeEvent[] = [];
	const lifecycleEvents: MediaProcessorGraphLifecycleEvent[] = [];
	const timingEvents: MediaProcessorTimingEvent[] = [];
	const maxInFlightFrames =
		input.maxInFlightFrames ?? Number.POSITIVE_INFINITY;
	const maxNodeProcessingMs =
		input.maxNodeProcessingMs ?? Number.POSITIVE_INFINITY;
	const maxQueuedFrames = input.maxQueuedFrames ?? Number.POSITIVE_INFINITY;
	const backpressureStrategy = input.backpressureStrategy ?? 'queue';
	const queueOverflowStrategy = input.queueOverflowStrategy ?? 'drop';
	const queuedTasks: Array<{
		frame: MediaFrame;
		resolve: (frames: readonly MediaFrame[]) => void;
		reject: (error: unknown) => void;
	}> = [];
	let hasStarted = false;
	let inFlightFrames = 0;
	let state: MediaProcessorGraphState = 'idle';

	const pushLifecycleEvent = (
		event: Omit<MediaProcessorGraphLifecycleEvent, 'at' | 'state'> & {
			state?: MediaProcessorGraphState;
		}
	) => {
		lifecycleEvents.push({
			...event,
			at: Date.now(),
			state: event.state ?? state
		});
	};

	const setState = (
		nextState: MediaProcessorGraphState,
		kind: MediaProcessorGraphLifecycleEventKind,
		event: Omit<
			MediaProcessorGraphLifecycleEvent,
			'at' | 'kind' | 'state'
		> = {}
	) => {
		state = nextState;
		pushLifecycleEvent({ ...event, kind, state: nextState });
	};

	const pushBackpressureEvent = (
		kind: MediaProcessorBackpressureEventKind,
		frame: MediaFrame
	) => {
		const event: MediaProcessorBackpressureEvent = {
			at: Date.now(),
			frameId: frame.id,
			inFlight: inFlightFrames,
			kind,
			maxInFlightFrames,
			maxQueuedFrames,
			queued: queuedTasks.length
		};
		backpressureEvents.push(event);
		pushLifecycleEvent({
			dropped: kind === 'drop' ? 1 : 0,
			error:
				kind === 'reject'
					? 'Media processor graph rejected a frame due to backpressure.'
					: undefined,
			frameId: frame.id,
			kind: 'backpressure'
		});
	};

	const processNow = async (frame: MediaFrame) => {
		if (state === 'closed') {
			pushLifecycleEvent({
				error: 'Cannot process frames after the media processor graph is closed.',
				frameId: frame.id,
				kind: 'error'
			});
			throw new Error(
				'Cannot process frames after the media processor graph is closed.'
			);
		}
		if (state === 'failed') {
			pushLifecycleEvent({
				error: 'Cannot process frames after the media processor graph has failed.',
				frameId: frame.id,
				kind: 'error'
			});
			throw new Error(
				'Cannot process frames after the media processor graph has failed.'
			);
		}

		if (!hasStarted) {
			hasStarted = true;
			setState('running', 'start', { frameId: frame.id, inputs: 1 });
		} else if (state === 'idle') {
			setState('running', 'process', { frameId: frame.id, inputs: 1 });
		}

		let frames: readonly MediaFrame[] = [frame];

		for (let nodeIndex = 0; nodeIndex < nodes.length; nodeIndex += 1) {
			const node = nodes[nodeIndex] as MediaProcessorNode;
			const nextNode = nodes[nodeIndex + 1];
			const nextFrames: MediaFrame[] = [];
			for (const current of frames) {
				let output: readonly MediaFrame[];
				try {
					const nodeStartedAt = performance.now();
					output = normalizeProcessorResult(
						current,
						await node.process(current)
					);
					timingEvents.push({
						at: Date.now(),
						durationMs: performance.now() - nodeStartedAt,
						frameId: current.id,
						node: node.name
					});
				} catch (error) {
					setState('failed', 'node-error', {
						error: error instanceof Error ? error.message : String(error),
						frameId: current.id,
						inputs: 1,
						node: node.name
					});
					throw error;
				}
				events.push({
					at: Date.now(),
					dropped: output.length === 0 ? 1 : 0,
					emitted: output.length,
					frameId: current.id,
					inputs: 1,
					node: node.name
				});
				if (output.length === 0) {
					edgeEvents.push({
						at: Date.now(),
						dropped: 1,
						emitted: 0,
						frameId: current.id,
						from: node.name,
						label: getProcessorEdgeLabel(node, current, output),
						outputFrameIds: [],
						to: nextNode?.name ?? 'output'
					});
				} else {
					for (const outputFrame of output) {
						edgeEvents.push({
							at: Date.now(),
							dropped: 0,
							emitted: 1,
							frameId: current.id,
							from: node.name,
							label: getProcessorEdgeLabel(
								node,
								current,
								output,
								outputFrame
							),
							outputFrameId: outputFrame.id,
							outputFrameIds: [outputFrame.id],
							to: nextNode?.name ?? 'output'
						});
					}
				}
				pushLifecycleEvent({
					dropped: output.length === 0 ? 1 : 0,
					emitted: output.length,
					frameId: current.id,
					inputs: 1,
					kind: 'process',
					node: node.name
				});
				nextFrames.push(...output);
			}
			frames = nextFrames;
			if (frames.length === 0) {
				break;
			}
		}

		if (state === 'running') {
			state = 'idle';
		}
		return frames;
	};

	const runQueuedTasks = () => {
		while (inFlightFrames < maxInFlightFrames && queuedTasks.length > 0) {
			const task = queuedTasks.shift();
			if (task === undefined) {
				return;
			}
			void runProcessTask(task.frame).then(task.resolve, task.reject);
		}
	};

	const runProcessTask = async (frame: MediaFrame) => {
		inFlightFrames += 1;
		pushBackpressureEvent('start', frame);
		try {
			return await processNow(frame);
		} finally {
			inFlightFrames -= 1;
			pushBackpressureEvent('complete', frame);
			runQueuedTasks();
		}
	};

	const process = async (frame: MediaFrame) => {
		if (inFlightFrames < maxInFlightFrames) {
			return runProcessTask(frame);
		}

		if (backpressureStrategy === 'drop') {
			pushBackpressureEvent('drop', frame);
			return [];
		}
		if (backpressureStrategy === 'reject') {
			pushBackpressureEvent('reject', frame);
			throw new Error(
				'Media processor graph rejected a frame due to backpressure.'
			);
		}
		if (queuedTasks.length >= maxQueuedFrames) {
			if (queueOverflowStrategy === 'reject') {
				pushBackpressureEvent('reject', frame);
				throw new Error(
					'Media processor graph queue is full.'
				);
			}
			pushBackpressureEvent('drop', frame);
			return [];
		}

		pushBackpressureEvent('queue', frame);
		return new Promise<readonly MediaFrame[]>((resolve, reject) => {
			queuedTasks.push({ frame, reject, resolve });
		});
	};

	const report = () =>
		buildMediaProcessorGraphReport({
			backpressureEvents,
			edgeEvents,
			events,
			lifecycleEvents,
			maxInFlightFrames,
			maxNodeProcessingMs,
			maxQueuedFrames,
			name: input.name ?? 'media-processor-graph',
			nodes,
			state,
			timingEvents
		});

	return {
		close: async () => {
			while (queuedTasks.length > 0) {
				const task = queuedTasks.shift();
				task?.reject(
					new Error(
						'Media processor graph closed before a queued frame could process.'
					)
				);
			}
			setState('closed', 'close');
		},
		drain: async () => {
			if (state === 'closed') {
				return [];
			}
			setState('draining', 'drain');
			const flushedFrames: MediaFrame[] = [];
			for (const node of nodes) {
				if (node.flush === undefined) {
					continue;
				}
				try {
					const output = normalizeProcessorFlushResult(await node.flush());
					flushedFrames.push(...output);
					pushLifecycleEvent({
						emitted: output.length,
						kind: 'drain',
						node: node.name
					});
				} catch (error) {
					setState('failed', 'node-error', {
						error: error instanceof Error ? error.message : String(error),
						node: node.name
					});
					throw error;
				}
			}
			if (state === 'draining') {
				state = 'idle';
			}
			return flushedFrames;
		},
		edgeEvents: () => edgeEvents,
		events: () => lifecycleEvents,
		nodes,
		process,
		processMany: async (frames) => {
			const output: MediaFrame[] = [];
			for (const frame of frames) {
				output.push(...(await process(frame)));
			}
			return output;
		},
		report,
		snapshot: () =>
			buildMediaProcessorGraphSnapshot({
				limits: {
					maxInFlightFrames,
					maxNodeProcessingMs,
					maxQueuedFrames
				},
				name: input.name ?? 'media-processor-graph',
				nodes,
				report: report()
			}),
		state: () => state,
		timingEvents: () => timingEvents
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

export const buildMediaQualityReport = (
	input: MediaQualityInput = {}
): MediaQualityReport => {
	const frames = [...(input.frames ?? [])].sort(
		(a, b) => (a.at ?? 0) - (b.at ?? 0)
	);
	const audioFrames = frames.filter(
		(frame) => frame.kind === 'input-audio' || frame.kind === 'assistant-audio'
	);
	const inputAudioFrames = frames.filter(
		(frame) => frame.kind === 'input-audio'
	);
	const assistantAudioFrames = frames.filter(
		(frame) => frame.kind === 'assistant-audio'
	);
	const issues: MediaPipelineCalibrationIssue[] = [];
	const gapsMs: number[] = [];

	for (const [index, frame] of audioFrames.entries()) {
		const previous = audioFrames[index - 1];
		if (
			previous?.at === undefined ||
			frame.at === undefined ||
			previous.durationMs === undefined
		) {
			continue;
		}
		const gap = frame.at - (previous.at + previous.durationMs);
		if (gap > 0) {
			gapsMs.push(gap);
		}
	}

	const jitterMs =
		audioFrames
			.map((frame) => numericMetadata(frame, 'jitterMs'))
			.filter((value): value is number => value !== undefined)
			.at(-1) ?? max(gapsMs);
	const first = audioFrames.find((frame) => frame.at !== undefined);
	const last = audioFrames
		.toReversed()
		.find((frame) => frame.at !== undefined);
	const durationMs =
		first?.at !== undefined && last?.at !== undefined
			? last.at - first.at + (last.durationMs ?? 0)
			: undefined;
	const expectedDurationMs =
		audioFrames.length > 0
			? audioFrames.reduce((total, frame) => total + (frame.durationMs ?? 0), 0)
			: undefined;
	const timestampDriftMs =
		durationMs !== undefined && expectedDurationMs !== undefined
			? Math.max(0, durationMs - expectedDurationMs)
			: undefined;
	const speechScores = inputAudioFrames.map(speechProbability);
	const speechFrames = speechScores.filter((score) => score >= 0.6).length;
	const silenceFrames = speechScores.filter((score) => score <= 0.35).length;
	const unknownSpeechFrames = Math.max(
		0,
		inputAudioFrames.length - speechFrames - silenceFrames
	);
	const speechRatio =
		inputAudioFrames.length === 0 ? 0 : speechFrames / inputAudioFrames.length;
	const silenceRatio =
		inputAudioFrames.length === 0 ? 0 : silenceFrames / inputAudioFrames.length;
	const levels = audioFrames
		.map(
			(frame) =>
				numericMetadata(frame, 'level') ??
				numericMetadata(frame, 'rms') ??
				numericMetadata(frame, 'energy')
		)
		.filter((value): value is number => value !== undefined);
	const backpressureEvents = input.transport?.backpressureEvents ?? 0;

	const maxGapMs = input.maxGapMs;
	if (maxGapMs !== undefined && gapsMs.some((gap) => gap > maxGapMs)) {
		pushIssue(
			issues,
			'warning',
			'media.quality_gap',
			`Observed media gap above ${String(maxGapMs)}ms.`
		);
	}
	if (
		input.maxJitterMs !== undefined &&
		jitterMs !== undefined &&
		jitterMs > input.maxJitterMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.quality_jitter',
			`Observed jitter ${String(jitterMs)}ms above ${String(input.maxJitterMs)}ms.`
		);
	}
	if (
		input.maxTimestampDriftMs !== undefined &&
		timestampDriftMs !== undefined &&
		timestampDriftMs > input.maxTimestampDriftMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.quality_timestamp_drift',
			`Observed timestamp drift ${String(timestampDriftMs)}ms above ${String(input.maxTimestampDriftMs)}ms.`
		);
	}
	if (
		input.minSpeechRatio !== undefined &&
		inputAudioFrames.length > 0 &&
		speechRatio < input.minSpeechRatio
	) {
		pushIssue(
			issues,
			'warning',
			'media.quality_speech_ratio',
			`Observed speech ratio ${String(speechRatio)} below ${String(input.minSpeechRatio)}.`
		);
	}
	if (
		input.maxBackpressureEvents !== undefined &&
		backpressureEvents > input.maxBackpressureEvents
	) {
		pushIssue(
			issues,
			'warning',
			'media.quality_backpressure',
			`Observed ${String(backpressureEvents)} backpressure event(s), above ${String(input.maxBackpressureEvents)}.`
		);
	}

	return {
		assistantAudioFrames: assistantAudioFrames.length,
		backpressureEvents,
		checkedAt: Date.now(),
		durationMs,
		gapCount: gapsMs.length,
		gapsMs,
		inputAudioFrames: inputAudioFrames.length,
		issues,
		jitterMs,
		levelAverage: average(levels),
		levelMax: max(levels),
		levelMin: min(levels),
		silenceFrames,
		silenceRatio,
		speechFrames,
		speechRatio,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass',
		timestampDriftMs,
		totalFrames: frames.length,
		unknownSpeechFrames
	};
};

export const buildMediaWebRTCStatsReport = (
	input: MediaWebRTCStatsInput = {}
): MediaWebRTCStatsReport => {
	const stats = input.stats ?? [];
	const issues: MediaPipelineCalibrationIssue[] = [];
	const inbound = stats.filter(
		(stat) => stat.type === 'inbound-rtp' && stringStat(stat, 'kind') !== 'video'
	);
	const outbound = stats.filter(
		(stat) => stat.type === 'outbound-rtp' && stringStat(stat, 'kind') !== 'video'
	);
	const candidatePairs = stats.filter((stat) => stat.type === 'candidate-pair');
	const audioTracks = stats.filter(
		(stat) =>
			(stat.type === 'track' || stat.type === 'media-source') &&
			stringStat(stat, 'kind') === 'audio'
	);
	const activeCandidatePairs = candidatePairs.filter(
		(stat) =>
			booleanStat(stat, 'selected') === true ||
			booleanStat(stat, 'nominated') === true ||
			stringStat(stat, 'state') === 'succeeded'
	).length;
	const liveAudioTracks = audioTracks.filter(
		(stat) =>
			stringStat(stat, 'readyState') !== 'ended' &&
			stringStat(stat, 'trackState') !== 'ended' &&
			booleanStat(stat, 'ended') !== true
	).length;
	const endedAudioTracks = audioTracks.filter(
		(stat) =>
			stringStat(stat, 'readyState') === 'ended' ||
			stringStat(stat, 'trackState') === 'ended' ||
			booleanStat(stat, 'ended') === true
	).length;
	const inboundPackets = inbound.reduce(
		(total, stat) => total + (numericStat(stat, 'packetsReceived') ?? 0),
		0
	);
	const outboundPackets = outbound.reduce(
		(total, stat) => total + (numericStat(stat, 'packetsSent') ?? 0),
		0
	);
	const packetsLost = [...inbound, ...outbound].reduce(
		(total, stat) => total + Math.max(0, numericStat(stat, 'packetsLost') ?? 0),
		0
	);
	const packetLossDenominator = inboundPackets + packetsLost;
	const packetLossRatio =
		packetLossDenominator === 0 ? 0 : packetsLost / packetLossDenominator;
	const bytesReceived = inbound.reduce(
		(total, stat) => total + (numericStat(stat, 'bytesReceived') ?? 0),
		0
	);
	const bytesSent = outbound.reduce(
		(total, stat) => total + (numericStat(stat, 'bytesSent') ?? 0),
		0
	);
	const roundTripTimeMs = max(
		candidatePairs
			.map((stat) =>
				secondsToMs(
					numericStat(stat, 'currentRoundTripTime') ??
						numericStat(stat, 'roundTripTime')
				)
			)
			.filter((value): value is number => value !== undefined)
	);
	const jitterMs = max(
		[...inbound, ...outbound]
			.map((stat) => secondsToMs(numericStat(stat, 'jitter')))
			.filter((value): value is number => value !== undefined)
	);
	const jitterBufferDelayMs = max(
		inbound
			.map((stat) => {
				const delay = numericStat(stat, 'jitterBufferDelay');
				const emitted = numericStat(stat, 'jitterBufferEmittedCount');
				return delay !== undefined && emitted !== undefined && emitted > 0
					? (delay / emitted) * 1000
					: undefined;
			})
			.filter((value): value is number => value !== undefined)
	);
	const audioLevels = audioTracks
		.map((stat) => numericStat(stat, 'audioLevel'))
		.filter((value): value is number => value !== undefined);

	if (
		input.requireConnectedCandidatePair &&
		candidatePairs.length > 0 &&
		activeCandidatePairs === 0
	) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_candidate_pair_missing',
			'No active WebRTC candidate pair was observed.'
		);
	}
	if (input.requireLiveAudioTrack && liveAudioTracks === 0) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_audio_track_missing',
			'No live WebRTC audio track was observed.'
		);
	}
	if (
		input.maxPacketLossRatio !== undefined &&
		packetLossRatio > input.maxPacketLossRatio
	) {
		pushIssue(
			issues,
			'warning',
			'media.webrtc_packet_loss',
			`Observed WebRTC packet loss ratio ${String(packetLossRatio)} above ${String(input.maxPacketLossRatio)}.`
		);
	}
	if (
		input.maxRoundTripTimeMs !== undefined &&
		roundTripTimeMs !== undefined &&
		roundTripTimeMs > input.maxRoundTripTimeMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.webrtc_round_trip_time',
			`Observed WebRTC RTT ${String(roundTripTimeMs)}ms above ${String(input.maxRoundTripTimeMs)}ms.`
		);
	}
	if (
		input.maxJitterMs !== undefined &&
		jitterMs !== undefined &&
		jitterMs > input.maxJitterMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.webrtc_jitter',
			`Observed WebRTC jitter ${String(jitterMs)}ms above ${String(input.maxJitterMs)}ms.`
		);
	}

	return {
		activeCandidatePairs,
		audioLevelAverage: average(audioLevels),
		bytesReceived,
		bytesSent,
		checkedAt: Date.now(),
		endedAudioTracks,
		inboundPackets,
		issues,
		jitterBufferDelayMs,
		jitterMs,
		liveAudioTracks,
		outboundPackets,
		packetLossRatio,
		packetsLost,
		roundTripTimeMs,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass',
		totalStats: stats.length
	};
};

export const collectMediaWebRTCStats = async (
	input: MediaWebRTCStatsCollectionInput
): Promise<readonly MediaWebRTCStatsSample[]> => {
	const report = await input.peerConnection.getStats(input.selector ?? null);

	return [...report.values()].map(normalizeWebRTCStat);
};

export const collectMediaWebRTCStatsReport = async (
	input: MediaWebRTCStatsReportInput
): Promise<MediaWebRTCStatsReport> => {
	const stats = await collectMediaWebRTCStats(input);

	return buildMediaWebRTCStatsReport({
		...input,
		stats
	});
};

export const buildMediaWebRTCStreamContinuityReport = (
	input: MediaWebRTCStreamContinuityInput = {}
): MediaWebRTCStreamContinuityReport => {
	const stats = input.stats ?? [];
	const previousStats = input.previousStats ?? [];
	const issues: MediaPipelineCalibrationIssue[] = [];
	const previousByKey = new Map(
		previousStats.map((stat) => [statKey(stat), stat])
	);
	const audioRtp = stats.filter(
		(stat) =>
			(stat.type === 'inbound-rtp' || stat.type === 'outbound-rtp') &&
			stringStat(stat, 'kind') !== 'video' &&
			stringStat(stat, 'mediaType') !== 'video'
	);
	const streams = audioRtp.map((stat) => {
		const direction = stat.type === 'outbound-rtp' ? 'outbound' : 'inbound';
		const packetsKey =
			direction === 'outbound' ? 'packetsSent' : 'packetsReceived';
		const bytesKey = direction === 'outbound' ? 'bytesSent' : 'bytesReceived';
		const previous = previousByKey.get(statKey(stat));
		const currentPackets = numericStat(stat, packetsKey);
		const previousPackets = previous
			? numericStat(previous, packetsKey)
			: undefined;
		const currentBytes = numericStat(stat, bytesKey);
		const previousBytes = previous ? numericStat(previous, bytesKey) : undefined;
		const timeDeltaMs =
			stat.timestamp !== undefined && previous?.timestamp !== undefined
				? stat.timestamp - previous.timestamp
				: undefined;

		return {
			bytesDelta:
				currentBytes !== undefined && previousBytes !== undefined
					? currentBytes - previousBytes
					: undefined,
			currentPackets,
			direction,
			id: statKey(stat),
			packetDelta:
				currentPackets !== undefined && previousPackets !== undefined
					? currentPackets - previousPackets
					: undefined,
			previousPackets,
			timeDeltaMs
		} satisfies MediaWebRTCStreamContinuityStream;
	});
	const inbound = streams.filter((stream) => stream.direction === 'inbound');
	const outbound = streams.filter((stream) => stream.direction === 'outbound');
	const maxObservedGapMs = max(
		streams
			.map((stream) => stream.timeDeltaMs)
			.filter((value): value is number => value !== undefined)
	);
	const stalledInboundStreams = inbound.filter(
		(stream) =>
			input.maxInboundPacketStallMs !== undefined &&
			stream.timeDeltaMs !== undefined &&
			stream.timeDeltaMs >= input.maxInboundPacketStallMs &&
			stream.packetDelta !== undefined &&
			stream.packetDelta <= 0
	).length;
	const stalledOutboundStreams = outbound.filter(
		(stream) =>
			input.maxOutboundPacketStallMs !== undefined &&
			stream.timeDeltaMs !== undefined &&
			stream.timeDeltaMs >= input.maxOutboundPacketStallMs &&
			stream.packetDelta !== undefined &&
			stream.packetDelta <= 0
	).length;

	if (input.requireInboundAudio && inbound.length === 0) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_inbound_audio_missing',
			'No inbound WebRTC audio RTP stream was observed.'
		);
	}
	if (input.requireOutboundAudio && outbound.length === 0) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_outbound_audio_missing',
			'No outbound WebRTC audio RTP stream was observed.'
		);
	}
	if (
		input.maxGapMs !== undefined &&
		maxObservedGapMs !== undefined &&
		maxObservedGapMs > input.maxGapMs
	) {
		pushIssue(
			issues,
			'warning',
			'media.webrtc_stream_gap',
			`Observed WebRTC stream sample gap ${String(maxObservedGapMs)}ms above ${String(input.maxGapMs)}ms.`
		);
	}
	if (stalledInboundStreams > 0) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_inbound_stalled',
			`${String(stalledInboundStreams)} inbound WebRTC audio stream(s) stopped receiving packets.`
		);
	}
	if (stalledOutboundStreams > 0) {
		pushIssue(
			issues,
			'error',
			'media.webrtc_outbound_stalled',
			`${String(stalledOutboundStreams)} outbound WebRTC audio stream(s) stopped sending packets.`
		);
	}

	return {
		checkedAt: Date.now(),
		inboundAudioStreams: inbound.length,
		issues,
		maxObservedGapMs,
		outboundAudioStreams: outbound.length,
		stalledInboundStreams,
		stalledOutboundStreams,
		status: issues.some((issue) => issue.severity === 'error')
			? 'fail'
			: issues.length > 0
				? 'warn'
				: 'pass',
		streams,
		totalStats: stats.length
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

export type MediaArtifactRedactionMode = 'mask' | 'omit';

export type MediaArtifactRedactionOptions = {
	maskValue?: string;
	metadataAllow?: readonly string[];
	metadataDeny?: readonly string[];
	mode?: MediaArtifactRedactionMode;
	truncateArraysAt?: number;
};

export type MediaArtifactRenderOptions = {
	redact?: MediaArtifactRedactionOptions;
	title?: string;
};

export type MediaQualitySummary = {
	backpressureEvents: number;
	description: string;
	driftMs?: number;
	frameCount: number;
	gapCount: number;
	issueCodes: readonly string[];
	issueCount: number;
	jitterMs?: number;
	silenceRatio: number;
	speechRatio: number;
	status: MediaPipelineStatus;
};

export type MediaTransportSummary = {
	backpressureEvents: number;
	description: string;
	errors: number;
	inputFrames: number;
	lastEventKind?: MediaTransportEventKind;
	name: string;
	outputFrames: number;
	state: MediaTransportState;
	status: MediaPipelineStatus;
};

export type MediaProcessorGraphSummary = {
	backpressureEvents: number;
	description: string;
	droppedFrames: number;
	edgeCount: number;
	edgeEventCount: number;
	emittedFrames: number;
	errorCount: number;
	inputFrames: number;
	issueCodes: readonly string[];
	lifecycleEventCount: number;
	name: string;
	nodeCount: number;
	state: MediaProcessorGraphState;
	status: MediaPipelineStatus;
	timingMaxMs: number;
};

export type MediaArtifactPair<TSummary, TJson = unknown> = {
	json: string;
	jsonValue: TJson;
	markdown: string;
	summary: TSummary;
};

export type MediaArtifactWriteInput<TSummary, TJson = unknown> = MediaArtifactPair<
	TSummary,
	TJson
> & {
	dir: string;
	slug: string;
};

export type MediaArtifactWriteResult<TSummary> = {
	jsonPath: string;
	markdownPath: string;
	summary: TSummary;
};

const DEFAULT_METADATA_DENY: readonly string[] = [
	'audioPayload',
	'auth',
	'authorization',
	'cookie',
	'email',
	'phone',
	'phoneNumber',
	'rawPayload',
	'secret',
	'token',
	'transcript',
	'utterance'
];

const DEFAULT_TRUNCATE = 8;

const issueCodes = (issues: readonly MediaPipelineCalibrationIssue[]) =>
	Array.from(new Set(issues.map((issue) => issue.code)));

const lastEventKind = (
	events: readonly MediaTransportEvent[]
): MediaTransportEventKind | undefined => events[events.length - 1]?.kind;

const formatOptionalMs = (value: number | undefined): string =>
	value === undefined ? 'n/a' : `${String(Math.round(value))}ms`;

const formatRatio = (value: number): string =>
	`${(value * 100).toFixed(1)}%`;

const escapeMarkdownCell = (value: string): string =>
	value.replace(/\|/g, '\\|').replace(/\n/g, ' ');

const renderIssuesTable = (
	issues: readonly MediaPipelineCalibrationIssue[]
): string => {
	if (issues.length === 0) {
		return '- No issues.\n';
	}
	const rows = issues
		.map(
			(issue) =>
				`| ${issue.severity} | ${escapeMarkdownCell(issue.code)} | ${escapeMarkdownCell(issue.message)} |`
		)
		.join('\n');
	return `| Severity | Code | Message |\n| --- | --- | --- |\n${rows}\n`;
};

export const summarizeMediaQualityReport = (
	report: MediaQualityReport
): MediaQualitySummary => ({
	backpressureEvents: report.backpressureEvents,
	description: `${report.totalFrames} frame(s), ${report.gapCount} gap(s), speech ${formatRatio(report.speechRatio)}, status ${report.status}.`,
	driftMs: report.timestampDriftMs,
	frameCount: report.totalFrames,
	gapCount: report.gapCount,
	issueCodes: issueCodes(report.issues),
	issueCount: report.issues.length,
	jitterMs: report.jitterMs,
	silenceRatio: report.silenceRatio,
	speechRatio: report.speechRatio,
	status: report.status
});

export const summarizeMediaTransportReport = (
	report: MediaTransportReport
): MediaTransportSummary => ({
	backpressureEvents: report.backpressureEvents,
	description: `${report.name}: ${report.state}, in ${report.inputFrames}, out ${report.outputFrames}, backpressure ${report.backpressureEvents}.`,
	errors: report.events.filter((event) => event.kind === 'error').length,
	inputFrames: report.inputFrames,
	lastEventKind: lastEventKind(report.events),
	name: report.name,
	outputFrames: report.outputFrames,
	state: report.state,
	status: report.status
});

export const summarizeMediaProcessorGraphReport = (
	report: MediaProcessorGraphReport
): MediaProcessorGraphSummary => {
	const errorIssueCodes = Array.from(
		new Set(report.errors.map((event) => event.kind))
	);
	return {
		backpressureEvents: report.backpressure.events.length,
		description: `${report.name}: ${report.state}, ${report.nodes.length} node(s), in ${report.inputFrames}, out ${report.emittedFrames}, dropped ${report.droppedFrames}.`,
		droppedFrames: report.droppedFrames,
		edgeCount: report.edges.length,
		edgeEventCount: report.edgeEvents.length,
		emittedFrames: report.emittedFrames,
		errorCount: report.errors.length,
		inputFrames: report.inputFrames,
		issueCodes: errorIssueCodes,
		lifecycleEventCount: report.lifecycleEvents.length,
		name: report.name,
		nodeCount: report.nodes.length,
		state: report.state,
		status: report.status,
		timingMaxMs: report.timing.maxNodeMs
	};
};

export const renderMediaQualityMarkdown = (
	report: MediaQualityReport,
	options: MediaArtifactRenderOptions = {}
): string => {
	const title = options.title ?? 'Media Quality Report';
	const lines = [
		`# ${title}`,
		'',
		`Status: **${report.status}**`,
		'',
		'| Metric | Value |',
		'| --- | ---: |',
		`| Total frames | ${report.totalFrames} |`,
		`| Input audio | ${report.inputAudioFrames} |`,
		`| Assistant audio | ${report.assistantAudioFrames} |`,
		`| Gaps | ${report.gapCount} |`,
		`| Jitter | ${formatOptionalMs(report.jitterMs)} |`,
		`| Timestamp drift | ${formatOptionalMs(report.timestampDriftMs)} |`,
		`| Speech ratio | ${formatRatio(report.speechRatio)} |`,
		`| Silence ratio | ${formatRatio(report.silenceRatio)} |`,
		`| Backpressure events | ${report.backpressureEvents} |`,
		'',
		'## Issues',
		'',
		renderIssuesTable(report.issues).trimEnd()
	];
	return `${lines.join('\n')}\n`;
};

export const renderMediaTransportMarkdown = (
	report: MediaTransportReport,
	options: MediaArtifactRenderOptions = {}
): string => {
	const title = options.title ?? `Media Transport: ${report.name}`;
	const limit = options.redact?.truncateArraysAt ?? DEFAULT_TRUNCATE;
	const events = report.events.slice(-limit);
	const eventRows =
		events.length === 0
			? '- No transport events recorded.'
			: ['| At | Kind | State | Buffered | Error |', '| --- | --- | --- | ---: | --- |']
					.concat(
						events.map(
							(event) =>
								`| ${event.at} | ${event.kind} | ${event.state} | ${
									event.bufferedFrames ?? ''
								} | ${escapeMarkdownCell(event.error ?? '')} |`
						)
					)
					.join('\n');
	const lines = [
		`# ${title}`,
		'',
		`Status: **${report.status}** · State: **${report.state}**`,
		'',
		'| Metric | Value |',
		'| --- | ---: |',
		`| Input frames | ${report.inputFrames} |`,
		`| Output frames | ${report.outputFrames} |`,
		`| Backpressure events | ${report.backpressureEvents} |`,
		`| Connected | ${report.connected ? 'yes' : 'no'} |`,
		`| Closed | ${report.closed ? 'yes' : 'no'} |`,
		`| Failed | ${report.failed ? 'yes' : 'no'} |`,
		'',
		`## Last ${events.length} event(s)`,
		'',
		eventRows
	];
	return `${lines.join('\n')}\n`;
};

export const renderMediaProcessorGraphMarkdown = (
	report: MediaProcessorGraphReport,
	options: MediaArtifactRenderOptions = {}
): string => {
	const title = options.title ?? `Media Processor Graph: ${report.name}`;
	const limit = options.redact?.truncateArraysAt ?? DEFAULT_TRUNCATE;
	const nodeRows = report.nodes
		.map(
			(node) =>
				`| ${escapeMarkdownCell(node.name)} | ${node.kind} | ${node.status} | ${node.inputFrames} | ${node.emittedFrames} | ${node.droppedFrames} | ${node.errors.length} |`
		)
		.join('\n');
	const edgeRows = report.edges
		.slice(0, limit)
		.map(
			(edge) =>
				`| ${escapeMarkdownCell(edge.from)} | ${escapeMarkdownCell(edge.to)} | ${edge.status} | ${edge.emittedFrames} |`
		)
		.join('\n');
	const issues = report.errors.map(
		(event): MediaPipelineCalibrationIssue => ({
			code: event.kind,
			message: event.error ?? `Processor graph ${event.kind} (state ${event.state}).`,
			severity: 'error'
		})
	);
	const lines = [
		`# ${title}`,
		'',
		`Status: **${report.status}** · State: **${report.state}**`,
		'',
		'| Metric | Value |',
		'| --- | ---: |',
		`| Nodes | ${report.nodes.length} |`,
		`| Input frames | ${report.inputFrames} |`,
		`| Emitted frames | ${report.emittedFrames} |`,
		`| Dropped frames | ${report.droppedFrames} |`,
		`| Lifecycle events | ${report.lifecycleEvents.length} |`,
		`| Edge events | ${report.edgeEvents.length} |`,
		`| Backpressure events | ${report.backpressure.events.length} |`,
		`| Timing max | ${formatOptionalMs(report.timing.maxNodeMs)} |`,
		`| Timing average | ${formatOptionalMs(report.timing.averageNodeMs)} |`,
		'',
		'## Nodes',
		'',
		nodeRows
			? `| Node | Kind | Status | In | Out | Dropped | Errors |\n| --- | --- | --- | ---: | ---: | ---: | ---: |\n${nodeRows}`
			: '- No nodes.',
		'',
		`## Edges (showing up to ${limit})`,
		'',
		edgeRows
			? `| From | To | Status | Frames |\n| --- | --- | --- | ---: |\n${edgeRows}`
			: '- No edges.',
		'',
		'## Errors',
		'',
		renderIssuesTable(issues).trimEnd()
	];
	return `${lines.join('\n')}\n`;
};

const truncateArrays = (
	value: unknown,
	limit: number,
	seen: WeakSet<object>
): unknown => {
	if (Array.isArray(value)) {
		const head = value.slice(0, limit).map((entry) => truncateArrays(entry, limit, seen));
		if (value.length > limit) {
			return [...head, { truncated: value.length - limit }];
		}
		return head;
	}
	if (value && typeof value === 'object') {
		if (seen.has(value as object)) return value;
		seen.add(value as object);
		const next: Record<string, unknown> = {};
		for (const [key, entry] of Object.entries(value)) {
			next[key] = truncateArrays(entry, limit, seen);
		}
		return next;
	}
	return value;
};

const applyRedaction = (
	value: unknown,
	options: MediaArtifactRedactionOptions,
	seen: WeakSet<object>
): unknown => {
	const mode = options.mode ?? 'omit';
	const maskValue = options.maskValue ?? '[redacted]';
	const allow = new Set(options.metadataAllow ?? []);
	const deny = new Set(options.metadataDeny ?? DEFAULT_METADATA_DENY);
	const walk = (input: unknown): unknown => {
		if (Array.isArray(input)) {
			return input.map((entry) => walk(entry));
		}
		if (input && typeof input === 'object') {
			if (seen.has(input as object)) return input;
			seen.add(input as object);
			const next: Record<string, unknown> = {};
			for (const [key, entry] of Object.entries(input)) {
				if (allow.has(key)) {
					next[key] = entry;
					continue;
				}
				if (deny.has(key)) {
					if (mode === 'mask') next[key] = maskValue;
					continue;
				}
				next[key] = walk(entry);
			}
			return next;
		}
		return input;
	};
	return walk(value);
};

export const redactMediaReport = <T>(
	report: T,
	options: MediaArtifactRedactionOptions = {}
): T => {
	const limit = options.truncateArraysAt ?? DEFAULT_TRUNCATE;
	const truncated = truncateArrays(report, limit, new WeakSet());
	return applyRedaction(truncated, options, new WeakSet()) as T;
};

const buildArtifactPair = <TReport, TSummary>(
	report: TReport,
	summary: TSummary,
	markdown: string,
	options: MediaArtifactRenderOptions
): MediaArtifactPair<TSummary, TReport> => {
	const jsonValue = options.redact
		? redactMediaReport(report, options.redact)
		: report;
	return {
		json: JSON.stringify(jsonValue, null, 2),
		jsonValue,
		markdown,
		summary
	};
};

export const buildMediaQualityArtifact = (
	report: MediaQualityReport,
	options: MediaArtifactRenderOptions = {}
): MediaArtifactPair<MediaQualitySummary, MediaQualityReport> =>
	buildArtifactPair(
		report,
		summarizeMediaQualityReport(report),
		renderMediaQualityMarkdown(report, options),
		options
	);

export const buildMediaTransportArtifact = (
	report: MediaTransportReport,
	options: MediaArtifactRenderOptions = {}
): MediaArtifactPair<MediaTransportSummary, MediaTransportReport> =>
	buildArtifactPair(
		report,
		summarizeMediaTransportReport(report),
		renderMediaTransportMarkdown(report, options),
		options
	);

export const buildMediaProcessorGraphArtifact = (
	report: MediaProcessorGraphReport,
	options: MediaArtifactRenderOptions = {}
): MediaArtifactPair<MediaProcessorGraphSummary, MediaProcessorGraphReport> =>
	buildArtifactPair(
		report,
		summarizeMediaProcessorGraphReport(report),
		renderMediaProcessorGraphMarkdown(report, options),
		options
	);

export const writeMediaArtifact = async <TSummary, TJson>(
	input: MediaArtifactWriteInput<TSummary, TJson>
): Promise<MediaArtifactWriteResult<TSummary>> => {
	const { mkdir, writeFile } = await import('node:fs/promises');
	const { join } = await import('node:path');
	await mkdir(input.dir, { recursive: true });
	const jsonPath = join(input.dir, `${input.slug}.json`);
	const markdownPath = join(input.dir, `${input.slug}.md`);
	await Promise.all([
		writeFile(jsonPath, input.json, 'utf8'),
		writeFile(markdownPath, input.markdown, 'utf8')
	]);
	return {
		jsonPath,
		markdownPath,
		summary: input.summary
	};
};
