import type { AudioFormat } from "./types";

export type AudioRedactionRange = {
  endMs: number;
  label?: string;
  startMs: number;
};

export type AudioRedactionFill =
  | { kind: "silence" }
  | { amplitudeDb?: number; frequencyHz?: number; kind: "tone" };

export type AudioRedactionOptions = {
  fill?: AudioRedactionFill;
};

const DEFAULT_TONE_FREQ_HZ = 1_000;
const DEFAULT_TONE_AMPLITUDE_DB = -12;
const TAU = Math.PI * 2;
const INT16_MAX = 0x7fff;

const dbToLinear = (db: number) => Math.pow(10, db / 20);

const toInt16Array = (
  pcm: ArrayBuffer | ArrayBufferView,
  channels: number,
): Int16Array => {
  if (pcm instanceof Int16Array) {
    return pcm.slice();
  }
  if (pcm instanceof ArrayBuffer) {
    return new Int16Array(pcm.slice(0));
  }
  const view = pcm;
  const buffer = view.buffer.slice(
    view.byteOffset,
    view.byteOffset + view.byteLength,
  );
  return new Int16Array(buffer);
};

const msToFrameIndex = (ms: number, format: AudioFormat) =>
  Math.max(0, Math.floor((ms / 1_000) * format.sampleRateHz));

const fillSilence = (
  samples: Int16Array,
  startFrame: number,
  endFrame: number,
  channels: number,
) => {
  const startSample = startFrame * channels;
  const endSample = Math.min(samples.length, endFrame * channels);
  for (let index = startSample; index < endSample; index += 1) {
    samples[index] = 0;
  }
};

const fillTone = (
  samples: Int16Array,
  startFrame: number,
  endFrame: number,
  format: AudioFormat,
  fill: AudioRedactionFill & { kind: "tone" },
) => {
  const channels = format.channels;
  const amplitude =
    INT16_MAX * dbToLinear(fill.amplitudeDb ?? DEFAULT_TONE_AMPLITUDE_DB);
  const frequencyHz = fill.frequencyHz ?? DEFAULT_TONE_FREQ_HZ;
  const phaseStep = (TAU * frequencyHz) / format.sampleRateHz;
  const startSample = startFrame * channels;
  const endSample = Math.min(samples.length, endFrame * channels);
  let phase = (startFrame * phaseStep) % TAU;
  for (let frame = startFrame; frame * channels < endSample; frame += 1) {
    const value = Math.round(Math.sin(phase) * amplitude);
    const clamped = Math.max(-INT16_MAX - 1, Math.min(INT16_MAX, value));
    for (let channel = 0; channel < channels; channel += 1) {
      const sampleIndex = frame * channels + channel;
      if (sampleIndex >= endSample || sampleIndex >= samples.length) break;
      samples[sampleIndex] = clamped;
    }
    phase += phaseStep;
    if (phase >= TAU) {
      phase -= TAU;
    }
  }
};

export const applyAudioRedaction = (
  pcm: ArrayBuffer | ArrayBufferView,
  format: AudioFormat,
  ranges: ReadonlyArray<AudioRedactionRange>,
  options: AudioRedactionOptions = {},
): Uint8Array => {
  if (format.container !== "raw" || format.encoding !== "pcm_s16le") {
    throw new Error(
      `applyAudioRedaction requires raw pcm_s16le input (got container=${format.container}, encoding=${format.encoding})`,
    );
  }
  const samples = toInt16Array(pcm, format.channels);
  const fill: AudioRedactionFill = options.fill ?? { kind: "silence" };
  for (const range of ranges) {
    if (range.endMs <= range.startMs) continue;
    const startFrame = msToFrameIndex(range.startMs, format);
    const endFrame = msToFrameIndex(range.endMs, format);
    if (fill.kind === "tone") {
      fillTone(samples, startFrame, endFrame, format, fill);
    } else {
      fillSilence(samples, startFrame, endFrame, format.channels);
    }
  }
  return new Uint8Array(samples.buffer, samples.byteOffset, samples.byteLength);
};

export const mergeAudioRedactionRanges = (
  ranges: ReadonlyArray<AudioRedactionRange>,
): AudioRedactionRange[] => {
  const sorted = [...ranges]
    .filter((range) => range.endMs > range.startMs)
    .sort((left, right) => left.startMs - right.startMs);
  const merged: AudioRedactionRange[] = [];
  for (const range of sorted) {
    const last = merged.at(-1);
    if (last && range.startMs <= last.endMs) {
      last.endMs = Math.max(last.endMs, range.endMs);
      if (range.label && !last.label) {
        last.label = range.label;
      }
      continue;
    }
    merged.push({ ...range });
  }
  return merged;
};
