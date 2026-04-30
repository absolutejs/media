import { describe, expect, test } from 'bun:test';
import {
	createTelephonyMediaSerializer,
	parseTelephonyMediaFrame,
	serializeTelephonyMediaFrame
} from '../src';

const audio = new Uint8Array([1, 2, 3, 4]);
const payload = Buffer.from(audio).toString('base64');

describe('telephony media serializers', () => {
	test('parses Twilio media envelopes into generic media frames', () => {
		const frame = parseTelephonyMediaFrame({
			carrier: 'twilio',
			envelope: {
				event: 'media',
				media: {
					chunk: '7',
					payload,
					timestamp: '1234',
					track: 'inbound'
				},
				sequenceNumber: '42',
				streamSid: 'twilio-stream-1'
			}
		});

		expect(frame).toMatchObject({
			at: 1234,
			format: {
				channels: 1,
				container: 'raw',
				encoding: 'mulaw',
				sampleRateHz: 8000
			},
			id: 'twilio:twilio-stream-1:7',
			kind: 'input-audio',
			metadata: {
				carrier: 'twilio',
				direction: 'inbound',
				event: 'media',
				sequenceNumber: '7',
				streamId: 'twilio-stream-1',
				track: 'inbound'
			},
			sessionId: 'twilio-stream-1',
			source: 'telephony'
		});
		expect(Array.from(frame?.audio as Uint8Array)).toEqual([1, 2, 3, 4]);
	});

	test('serializes generic media frames into carrier envelopes', () => {
		const telnyx = serializeTelephonyMediaFrame({
			carrier: 'telnyx',
			frame: {
				at: 2000,
				audio,
				format: {
					channels: 1,
					container: 'raw',
					encoding: 'mulaw',
					sampleRateHz: 8000
				},
				id: 'assistant-audio-1',
				kind: 'assistant-audio',
				sessionId: 'telnyx-stream-1',
				source: 'telephony'
			},
			sequenceNumber: 8
		});

		expect(telnyx).toMatchObject({
			event: 'media',
			media: {
				payload,
				timestamp: 2000,
				track: 'outbound'
			},
			sequence_number: 8,
			stream_id: 'telnyx-stream-1'
		});
	});

	test('round trips Plivo envelopes through a reusable serializer', () => {
		const serializer = createTelephonyMediaSerializer({
			carrier: 'plivo',
			streamId: 'plivo-stream-1'
		});
		const frame = serializer.parse({
			event: 'media',
			media: {
				payload,
				timestamp: 3000,
				track: 'inbound'
			},
			sequenceNumber: 9,
			streamId: 'plivo-stream-1'
		});
		const envelope = frame ? serializer.serialize(frame) : undefined;

		expect(frame?.kind).toBe('input-audio');
		expect(envelope).toMatchObject({
			event: 'media',
			media: {
				payload,
				timestamp: 3000,
				track: 'inbound'
			},
			streamId: 'plivo-stream-1'
		});
	});

	test('ignores non-media envelopes without audio payloads', () => {
		expect(
			parseTelephonyMediaFrame({
				carrier: 'twilio',
				envelope: {
					event: 'start',
					streamSid: 'twilio-stream-1'
				}
			})
		).toBeUndefined();
	});
});
