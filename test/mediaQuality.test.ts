import { describe, expect, test } from "bun:test";
import {
  buildMediaQualityReport,
  createMediaFrame,
  createMediaTransport,
} from "../src";

const raw24k = {
  channels: 1,
  container: "raw",
  encoding: "pcm_s16le",
  sampleRateHz: 24_000,
} as const;

describe("media quality", () => {
  test("reports healthy frame continuity and speech ratio", () => {
    const report = buildMediaQualityReport({
      frames: [
        createMediaFrame({
          at: 0,
          durationMs: 20,
          format: raw24k,
          id: "input-1",
          kind: "input-audio",
          metadata: { level: 0.42, speechProbability: 0.9 },
          source: "browser",
        }),
        createMediaFrame({
          at: 20,
          durationMs: 20,
          format: raw24k,
          id: "assistant-1",
          kind: "assistant-audio",
          metadata: { jitterMs: 4, level: 0.48 },
          source: "provider",
        }),
      ],
      maxGapMs: 5,
      maxJitterMs: 20,
      maxTimestampDriftMs: 5,
      minSpeechRatio: 0.8,
    });

    expect(report.status).toBe("pass");
    expect(report.gapCount).toBe(0);
    expect(report.inputAudioFrames).toBe(1);
    expect(report.assistantAudioFrames).toBe(1);
    expect(report.speechRatio).toBe(1);
    expect(report.levelAverage).toBeCloseTo(0.45);
  });

  test("warns on gaps, jitter, drift, speech ratio, and backpressure", async () => {
    const transport = createMediaTransport({
      maxBufferedFrames: 0,
      name: "quality-test",
    });
    await transport.connect?.();
    await transport.receive(
      createMediaFrame({
        id: "input-transport",
        kind: "input-audio",
        source: "browser",
      }),
    );
    const report = buildMediaQualityReport({
      frames: [
        createMediaFrame({
          at: 0,
          durationMs: 20,
          format: raw24k,
          id: "input-1",
          kind: "input-audio",
          metadata: { speechProbability: 0.1 },
          source: "browser",
        }),
        createMediaFrame({
          at: 80,
          durationMs: 20,
          format: raw24k,
          id: "assistant-1",
          kind: "assistant-audio",
          metadata: { jitterMs: 60 },
          source: "provider",
        }),
      ],
      maxBackpressureEvents: 0,
      maxGapMs: 10,
      maxJitterMs: 20,
      maxTimestampDriftMs: 10,
      minSpeechRatio: 0.8,
      transport: transport.report(),
    });

    expect(report.status).toBe("warn");
    expect(report.gapCount).toBe(1);
    expect(report.backpressureEvents).toBe(1);
    expect(report.issues.map((issue) => issue.code)).toEqual(
      expect.arrayContaining([
        "media.quality_backpressure",
        "media.quality_gap",
        "media.quality_jitter",
        "media.quality_speech_ratio",
        "media.quality_timestamp_drift",
      ]),
    );
  });
});
