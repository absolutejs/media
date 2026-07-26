import type {
  NoiseSuppressor,
  NoiseSuppressorOutput,
} from "./noiseSuppression";
import type { AudioFormat } from "./types";

export type FFmpegProcessHandle = {
  exited: Promise<number>;
  stderr: ReadableStream<Uint8Array>;
  stdin: { end: () => void; write: (chunk: Uint8Array) => unknown };
  stdout: ReadableStream<Uint8Array>;
};

export type FFmpegSpawnInput = {
  args: string[];
  bin: string;
};

export type FFmpegSpawnFn = (input: FFmpegSpawnInput) => FFmpegProcessHandle;

const defaultSpawn: FFmpegSpawnFn = ({ args, bin }) => {
  const proc = Bun.spawn([bin, ...args], {
    stderr: "pipe",
    stdin: "pipe",
    stdout: "pipe",
  });
  return {
    exited: proc.exited,
    stderr: proc.stderr as ReadableStream<Uint8Array>,
    stdin: {
      end: () => {
        proc.stdin.end();
      },
      write: (chunk: Uint8Array) => proc.stdin.write(chunk),
    },
    stdout: proc.stdout as ReadableStream<Uint8Array>,
  };
};

export type FFmpegNoiseSuppressorMode =
  | { kind: "afftdn"; noiseFloorDb?: number }
  | { kind: "anlmdn"; strength?: number }
  | { kind: "arnndn"; modelPath: string };

export type CreateFFmpegNoiseSuppressorOptions = {
  binary?: string;
  mode?: FFmpegNoiseSuppressorMode;
  spawn?: FFmpegSpawnFn;
};

const ensureSupportedFormat = (format: AudioFormat) => {
  if (format.container !== "raw" || format.encoding !== "pcm_s16le") {
    throw new Error(
      `createFFmpegNoiseSuppressor requires raw pcm_s16le input (got container=${format.container}, encoding=${format.encoding})`,
    );
  }
};

const buildFilter = (mode: FFmpegNoiseSuppressorMode): string => {
  if (mode.kind === "arnndn") {
    return `arnndn=m=${mode.modelPath}`;
  }
  if (mode.kind === "anlmdn") {
    const strength = mode.strength ?? 0.0001;
    return `anlmdn=s=${strength}`;
  }
  const nf = mode.noiseFloorDb ?? -25;
  return `afftdn=nf=${nf}`;
};

const toUint8Array = (input: ArrayBuffer | ArrayBufferView): Uint8Array => {
  if (input instanceof Uint8Array) return input;
  if (input instanceof ArrayBuffer) return new Uint8Array(input);
  return new Uint8Array(input.buffer, input.byteOffset, input.byteLength);
};

const readAll = async (
  stream: ReadableStream<Uint8Array>,
): Promise<Uint8Array> => {
  const reader = stream.getReader();
  const chunks: Uint8Array[] = [];
  let total = 0;
  while (true) {
    const { done, value } = await reader.read();
    if (done) break;
    if (value) {
      chunks.push(value);
      total += value.byteLength;
    }
  }
  const out = new Uint8Array(total);
  let offset = 0;
  for (const chunk of chunks) {
    out.set(chunk, offset);
    offset += chunk.byteLength;
  }
  return out;
};

export const createFFmpegNoiseSuppressor = (
  options: CreateFFmpegNoiseSuppressorOptions = {},
): NoiseSuppressor => {
  const binary = options.binary ?? "ffmpeg";
  const mode: FFmpegNoiseSuppressorMode = options.mode ?? { kind: "afftdn" };
  const spawn = options.spawn ?? defaultSpawn;
  return {
    kind: `ffmpeg:${mode.kind}`,
    process: async ({ format, pcm }): Promise<NoiseSuppressorOutput> => {
      ensureSupportedFormat(format);
      const args = [
        "-hide_banner",
        "-loglevel",
        "error",
        "-f",
        "s16le",
        "-ar",
        String(format.sampleRateHz),
        "-ac",
        String(format.channels),
        "-i",
        "pipe:0",
        "-af",
        buildFilter(mode),
        "-f",
        "s16le",
        "-ar",
        String(format.sampleRateHz),
        "-ac",
        String(format.channels),
        "pipe:1",
      ];
      const proc = spawn({ args, bin: binary });
      const stdoutPromise = readAll(proc.stdout);
      const stderrPromise = readAll(proc.stderr);
      await proc.stdin.write(toUint8Array(pcm));
      proc.stdin.end();
      const exitCode = await proc.exited;
      const stdout = await stdoutPromise;
      if (exitCode !== 0) {
        const stderr = await stderrPromise;
        const message = new TextDecoder().decode(stderr).trim();
        throw new Error(
          `FFmpeg noise suppression failed (exit ${exitCode}): ${
            message.slice(0, 240) || "no stderr output"
          }`,
        );
      }
      return { bytes: stdout, format };
    },
  };
};
