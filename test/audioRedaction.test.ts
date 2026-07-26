import { describe, expect, test } from "bun:test";
import {
  applyAudioRedaction,
  mergeAudioRedactionRanges,
} from "../src/audioRedaction";
import type { AudioFormat } from "../src/types";

const PCM_FORMAT: AudioFormat = {
  channels: 1,
  container: "raw",
  encoding: "pcm_s16le",
  sampleRateHz: 16_000,
};

const buildSine = (durationMs: number, frequencyHz = 440) => {
  const sampleCount = Math.floor(
    (durationMs / 1_000) * PCM_FORMAT.sampleRateHz,
  );
  const samples = new Int16Array(sampleCount);
  for (let index = 0; index < sampleCount; index += 1) {
    const value = Math.sin(
      (2 * Math.PI * frequencyHz * index) / PCM_FORMAT.sampleRateHz,
    );
    samples[index] = Math.round(value * 0x7fff);
  }
  return new Uint8Array(samples.buffer);
};

const pcmRms = (bytes: Uint8Array, startSample: number, endSample: number) => {
  const samples = new Int16Array(
    bytes.buffer,
    bytes.byteOffset,
    bytes.byteLength / 2,
  );
  let sumSquares = 0;
  const count = Math.max(0, endSample - startSample);
  if (count === 0) return 0;
  for (let index = startSample; index < endSample; index += 1) {
    const normalized = samples[index]! / 0x7fff;
    sumSquares += normalized * normalized;
  }
  return Math.sqrt(sumSquares / count);
};

describe("applyAudioRedaction", () => {
  test("zeroes out the requested range with silence fill", () => {
    const pcm = buildSine(1_000); // 16k samples
    const redacted = applyAudioRedaction(pcm, PCM_FORMAT, [
      { endMs: 600, startMs: 200 },
    ]);
    // 200-600ms = samples 3200..9600
    expect(pcmRms(redacted, 3_200, 9_600)).toBe(0);
    // 0-200ms stays loud
    expect(pcmRms(redacted, 0, 3_200)).toBeGreaterThan(0.5);
    // 600-1000ms stays loud
    expect(pcmRms(redacted, 9_600, 16_000)).toBeGreaterThan(0.5);
  });

  test("writes a tone of the requested amplitude when fill.kind=tone", () => {
    const pcm = buildSine(1_000);
    const redacted = applyAudioRedaction(
      pcm,
      PCM_FORMAT,
      [{ endMs: 500, startMs: 250 }],
      { fill: { amplitudeDb: -12, frequencyHz: 1_000, kind: "tone" } },
    );
    const rmsInside = pcmRms(redacted, 4_000, 8_000);
    // -12dB → ~0.25 linear; RMS of a sine at that amplitude ≈ 0.177
    expect(rmsInside).toBeGreaterThan(0.1);
    expect(rmsInside).toBeLessThan(0.25);
  });

  test("returns the input length even with overlapping ranges", () => {
    const pcm = buildSine(500);
    const redacted = applyAudioRedaction(pcm, PCM_FORMAT, [
      { endMs: 200, startMs: 0 },
      { endMs: 300, startMs: 150 },
    ]);
    expect(redacted.byteLength).toBe(pcm.byteLength);
  });

  test("throws on non-pcm_s16le input", () => {
    expect(() =>
      applyAudioRedaction(
        new Uint8Array(2),
        {
          ...PCM_FORMAT,
          encoding: "pcm_f32le",
        } as AudioFormat,
        [],
      ),
    ).toThrow();
  });

  test("ignores zero-or-negative duration ranges", () => {
    const pcm = buildSine(200);
    const redacted = applyAudioRedaction(pcm, PCM_FORMAT, [
      { endMs: 50, startMs: 50 },
      { endMs: 30, startMs: 100 },
    ]);
    expect(pcmRms(redacted, 0, 3_200)).toBeGreaterThan(0.5);
  });
});

describe("mergeAudioRedactionRanges", () => {
  test("merges overlapping ranges", () => {
    expect(
      mergeAudioRedactionRanges([
        { endMs: 300, startMs: 100 },
        { endMs: 500, startMs: 250 },
        { endMs: 700, startMs: 600 },
      ]),
    ).toEqual([
      { endMs: 500, startMs: 100 },
      { endMs: 700, startMs: 600 },
    ]);
  });

  test("preserves labels from the first contributing range", () => {
    const merged = mergeAudioRedactionRanges([
      { endMs: 300, label: "cc", startMs: 100 },
      { endMs: 500, label: "ssn", startMs: 250 },
    ]);
    expect(merged).toHaveLength(1);
    expect(merged[0]!.label).toBe("cc");
  });

  test("drops zero-or-negative duration ranges", () => {
    expect(
      mergeAudioRedactionRanges([
        { endMs: 100, startMs: 100 },
        { endMs: 50, startMs: 200 },
      ]),
    ).toEqual([]);
  });
});
