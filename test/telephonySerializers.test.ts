import { describe, expect, test } from "bun:test";
import {
  buildMediaTelephonyStreamLifecycleReport,
  createTelephonyMediaSerializer,
  parseTelephonyStreamEvent,
  parseTelephonyMediaFrame,
  serializeTelephonyMediaFrame,
} from "../src";

const audio = new Uint8Array([1, 2, 3, 4]);
const payload = Buffer.from(audio).toString("base64");

describe("telephony media serializers", () => {
  test("parses Twilio media envelopes into generic media frames", () => {
    const frame = parseTelephonyMediaFrame({
      carrier: "twilio",
      envelope: {
        event: "media",
        media: {
          chunk: "7",
          payload,
          timestamp: "1234",
          track: "inbound",
        },
        sequenceNumber: "42",
        streamSid: "twilio-stream-1",
      },
    });

    expect(frame).toMatchObject({
      at: 1234,
      format: {
        channels: 1,
        container: "raw",
        encoding: "mulaw",
        sampleRateHz: 8000,
      },
      id: "twilio:twilio-stream-1:7",
      kind: "input-audio",
      metadata: {
        carrier: "twilio",
        direction: "inbound",
        event: "media",
        sequenceNumber: "7",
        streamId: "twilio-stream-1",
        track: "inbound",
      },
      sessionId: "twilio-stream-1",
      source: "telephony",
    });
    expect(Array.from(frame?.audio as Uint8Array)).toEqual([1, 2, 3, 4]);
  });

  test("serializes generic media frames into carrier envelopes", () => {
    const telnyx = serializeTelephonyMediaFrame({
      carrier: "telnyx",
      frame: {
        at: 2000,
        audio,
        format: {
          channels: 1,
          container: "raw",
          encoding: "mulaw",
          sampleRateHz: 8000,
        },
        id: "assistant-audio-1",
        kind: "assistant-audio",
        sessionId: "telnyx-stream-1",
        source: "telephony",
      },
      sequenceNumber: 8,
    });

    expect(telnyx).toMatchObject({
      event: "media",
      media: {
        payload,
        timestamp: 2000,
        track: "outbound",
      },
      sequence_number: 8,
      stream_id: "telnyx-stream-1",
    });
  });

  test("round trips Plivo envelopes through a reusable serializer", () => {
    const serializer = createTelephonyMediaSerializer({
      carrier: "plivo",
      streamId: "plivo-stream-1",
    });
    const frame = serializer.parse({
      event: "media",
      media: {
        payload,
        timestamp: 3000,
        track: "inbound",
      },
      sequenceNumber: 9,
      streamId: "plivo-stream-1",
    });
    const envelope = frame ? serializer.serialize(frame) : undefined;

    expect(frame?.kind).toBe("input-audio");
    expect(envelope).toMatchObject({
      event: "media",
      media: {
        payload,
        timestamp: 3000,
        track: "inbound",
      },
      streamId: "plivo-stream-1",
    });
  });

  test("ignores non-media envelopes without audio payloads", () => {
    expect(
      parseTelephonyMediaFrame({
        carrier: "twilio",
        envelope: {
          event: "start",
          streamSid: "twilio-stream-1",
        },
      }),
    ).toBeUndefined();
  });

  test("parses carrier stream lifecycle events", () => {
    const event = parseTelephonyStreamEvent({
      carrier: "twilio",
      envelope: {
        event: "start",
        start: {
          streamSid: "twilio-stream-1",
        },
      },
    });

    expect(event).toMatchObject({
      audioBytes: 0,
      carrier: "twilio",
      kind: "start",
      streamId: "twilio-stream-1",
    });
  });

  test("reports healthy telephony stream lifecycle sequencing and byte flow", () => {
    const report = buildMediaTelephonyStreamLifecycleReport({
      carrier: "telnyx",
      envelopes: [
        {
          event: "start",
          stream_id: "telnyx-stream-1",
        },
        {
          event: "media",
          media: {
            payload,
            timestamp: 1000,
            track: "inbound",
          },
          stream_id: "telnyx-stream-1",
        },
        {
          event: "stop",
          stream_id: "telnyx-stream-1",
        },
      ],
    });

    expect(report).toMatchObject({
      audioBytes: 4,
      mediaEvents: 1,
      started: true,
      status: "pass",
      stopped: true,
      streamIds: ["telnyx-stream-1"],
    });
  });

  test("fails telephony stream lifecycle when media arrives before start", () => {
    const report = buildMediaTelephonyStreamLifecycleReport({
      carrier: "plivo",
      envelopes: [
        {
          event: "media",
          media: {
            payload,
            timestamp: 1000,
            track: "inbound",
          },
          streamId: "plivo-stream-1",
        },
        {
          event: "start",
          streamId: "plivo-stream-1",
        },
      ],
    });

    expect(report.status).toBe("fail");
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "media.telephony_media_before_start",
        "media.telephony_missing_stop",
      ]),
    );
  });
});
