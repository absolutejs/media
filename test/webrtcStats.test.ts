import { describe, expect, test } from 'bun:test';
import {
	buildMediaWebRTCStatsReport,
	collectMediaWebRTCStats,
	collectMediaWebRTCStatsReport
} from '../src';

describe('webrtc stats', () => {
	test('reports healthy browser media transport stats', () => {
		const report = buildMediaWebRTCStatsReport({
			maxJitterMs: 30,
			maxPacketLossRatio: 0.02,
			maxRoundTripTimeMs: 250,
			requireConnectedCandidatePair: true,
			requireLiveAudioTrack: true,
			stats: [
				{
					bytesReceived: 240_000,
					id: 'inbound-audio',
					jitter: 0.008,
					kind: 'audio',
					packetsLost: 1,
					packetsReceived: 999,
					type: 'inbound-rtp'
				},
				{
					bytesSent: 210_000,
					id: 'outbound-audio',
					kind: 'audio',
					packetsSent: 1000,
					type: 'outbound-rtp'
				},
				{
					currentRoundTripTime: 0.08,
					id: 'candidate-pair',
					selected: true,
					state: 'succeeded',
					type: 'candidate-pair'
				},
				{
					audioLevel: 0.42,
					id: 'local-audio',
					kind: 'audio',
					readyState: 'live',
					type: 'media-source'
				}
			]
		});

		expect(report.status).toBe('pass');
		expect(report.activeCandidatePairs).toBe(1);
		expect(report.liveAudioTracks).toBe(1);
		expect(report.packetLossRatio).toBeCloseTo(0.001);
		expect(report.roundTripTimeMs).toBe(80);
		expect(report.jitterMs).toBe(8);
		expect(report.bytesReceived).toBe(240_000);
		expect(report.bytesSent).toBe(210_000);
	});

	test('fails missing connectivity and warns on unhealthy stats', () => {
		const report = buildMediaWebRTCStatsReport({
			maxJitterMs: 20,
			maxPacketLossRatio: 0.02,
			maxRoundTripTimeMs: 100,
			requireConnectedCandidatePair: true,
			requireLiveAudioTrack: true,
			stats: [
				{
					bytesReceived: 100,
					id: 'inbound-audio',
					jitter: 0.08,
					kind: 'audio',
					packetsLost: 10,
					packetsReceived: 90,
					type: 'inbound-rtp'
				},
				{
					currentRoundTripTime: 0.35,
					id: 'candidate-pair',
					state: 'failed',
					type: 'candidate-pair'
				},
				{
					id: 'local-audio',
					kind: 'audio',
					readyState: 'ended',
					type: 'track'
				}
			]
		});

		expect(report.status).toBe('fail');
		expect(report.endedAudioTracks).toBe(1);
		expect(report.issues.map((issue) => issue.code)).toEqual(
			expect.arrayContaining([
				'media.webrtc_audio_track_missing',
				'media.webrtc_candidate_pair_missing',
				'media.webrtc_jitter',
				'media.webrtc_packet_loss',
				'media.webrtc_round_trip_time'
			])
		);
	});

	test('collects normalized samples from a browser peer connection', async () => {
		const peerConnection = {
			getStats: () =>
				new Map<string, RTCStats>([
					[
						'inbound-audio',
						{
							bytesReceived: 120_000,
							id: 'inbound-audio',
							jitter: 0.01,
							kind: 'audio',
							packetsLost: 0,
							packetsReceived: 500,
							timestamp: 1,
							type: 'inbound-rtp'
						} as unknown as RTCStats
					],
					[
						'candidate-pair',
						{
							currentRoundTripTime: 0.05,
							id: 'candidate-pair',
							selected: true,
							timestamp: 1,
							type: 'candidate-pair'
						} as unknown as RTCStats
					]
				]) as unknown as RTCStatsReport
		};

		const stats = await collectMediaWebRTCStats({ peerConnection });

		expect(stats).toHaveLength(2);
		expect(stats[0]).toMatchObject({
			bytesReceived: 120_000,
			id: 'inbound-audio',
			type: 'inbound-rtp'
		});
	});

	test('builds a report directly from a browser peer connection', async () => {
		const peerConnection = {
			getStats: () =>
				new Map<string, RTCStats>([
					[
						'inbound-audio',
						{
							bytesReceived: 120_000,
							id: 'inbound-audio',
							jitter: 0.01,
							kind: 'audio',
							packetsLost: 0,
							packetsReceived: 500,
							timestamp: 1,
							type: 'inbound-rtp'
						} as unknown as RTCStats
					],
					[
						'outbound-audio',
						{
							bytesSent: 110_000,
							id: 'outbound-audio',
							kind: 'audio',
							packetsSent: 500,
							timestamp: 1,
							type: 'outbound-rtp'
						} as unknown as RTCStats
					],
					[
						'candidate-pair',
						{
							currentRoundTripTime: 0.05,
							id: 'candidate-pair',
							selected: true,
							timestamp: 1,
							type: 'candidate-pair'
						} as unknown as RTCStats
					],
					[
						'local-audio',
						{
							audioLevel: 0.2,
							id: 'local-audio',
							kind: 'audio',
							readyState: 'live',
							timestamp: 1,
							type: 'media-source'
						} as unknown as RTCStats
					]
				]) as unknown as RTCStatsReport
		};

		const report = await collectMediaWebRTCStatsReport({
			maxJitterMs: 30,
			maxPacketLossRatio: 0.02,
			maxRoundTripTimeMs: 250,
			peerConnection,
			requireConnectedCandidatePair: true,
			requireLiveAudioTrack: true
		});

		expect(report.status).toBe('pass');
		expect(report.activeCandidatePairs).toBe(1);
		expect(report.liveAudioTracks).toBe(1);
		expect(report.roundTripTimeMs).toBe(50);
		expect(report.totalStats).toBe(4);
	});
});
