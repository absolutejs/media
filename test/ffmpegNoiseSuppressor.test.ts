import { describe, expect, test } from "bun:test";
import {
  createFFmpegNoiseSuppressor,
  type FFmpegSpawnFn,
} from "../src/ffmpegNoiseSuppressor";
import type { AudioFormat } from "../src/types";

const FORMAT: AudioFormat = {
  channels: 1,
  container: "raw",
  encoding: "pcm_s16le",
  sampleRateHz: 16_000,
};

const buildPcm = (samples: number) => {
  const out = new Int16Array(samples);
  for (let i = 0; i < samples; i += 1) out[i] = (i % 32768) - 16384;
  return new Uint8Array(out.buffer);
};

const streamOf = (chunks: Uint8Array[]): ReadableStream<Uint8Array> =>
  new ReadableStream({
    start(controller) {
      for (const chunk of chunks) controller.enqueue(chunk);
      controller.close();
    },
  });

const makeFakeSpawn = (
  options: {
    exitCode?: number;
    stderr?: Uint8Array;
    stdout?: Uint8Array;
    writes?: Uint8Array[];
  } = {},
) => {
  const writes: Uint8Array[] = options.writes ?? [];
  const calls: Array<{ args: string[]; bin: string }> = [];
  const spawn: FFmpegSpawnFn = ({ args, bin }) => {
    calls.push({ args, bin });
    return {
      exited: Promise.resolve(options.exitCode ?? 0),
      stderr: streamOf(options.stderr ? [options.stderr] : []),
      stdin: {
        end: () => {},
        write: (chunk: Uint8Array) => {
          writes.push(chunk);
        },
      },
      stdout: streamOf(options.stdout ? [options.stdout] : []),
    };
  };
  return { calls, spawn, writes };
};

describe("createFFmpegNoiseSuppressor", () => {
  test("default mode invokes afftdn with the configured noise floor", async () => {
    const pcm = buildPcm(800);
    const expected = buildPcm(800);
    const { calls, spawn } = makeFakeSpawn({ stdout: expected });
    const suppressor = createFFmpegNoiseSuppressor({ spawn });
    const result = await suppressor.process({ format: FORMAT, pcm });
    expect(result.format).toEqual(FORMAT);
    expect(result.bytes.byteLength).toBe(expected.byteLength);
    expect(calls[0]!.bin).toBe("ffmpeg");
    const argString = calls[0]!.args.join(" ");
    expect(argString).toContain("afftdn=nf=-25");
    expect(argString).toContain("s16le");
    expect(argString).toContain(String(FORMAT.sampleRateHz));
  });

  test("arnndn mode threads the model path through", async () => {
    const { calls, spawn } = makeFakeSpawn({
      stdout: buildPcm(160),
    });
    const suppressor = createFFmpegNoiseSuppressor({
      mode: { kind: "arnndn", modelPath: "/models/rnnoise.rnnn" },
      spawn,
    });
    await suppressor.process({
      format: FORMAT,
      pcm: buildPcm(160),
    });
    expect(calls[0]!.args.join(" ")).toContain("arnndn=m=/models/rnnoise.rnnn");
  });

  test("honors a custom binary path", async () => {
    const { calls, spawn } = makeFakeSpawn({ stdout: buildPcm(80) });
    const suppressor = createFFmpegNoiseSuppressor({
      binary: "/usr/local/bin/ffmpeg",
      spawn,
    });
    await suppressor.process({
      format: FORMAT,
      pcm: buildPcm(80),
    });
    expect(calls[0]!.bin).toBe("/usr/local/bin/ffmpeg");
  });

  test("rejects non-pcm_s16le input", async () => {
    const suppressor = createFFmpegNoiseSuppressor({
      spawn: () => {
        throw new Error("should not spawn");
      },
    });
    expect(() =>
      suppressor.process({
        format: { ...FORMAT, encoding: "pcm_f32le" } as AudioFormat,
        pcm: new Uint8Array(2),
      }),
    ).toThrow();
  });

  test("throws when ffmpeg exits non-zero, surfacing stderr context", async () => {
    const { spawn } = makeFakeSpawn({
      exitCode: 1,
      stderr: new TextEncoder().encode("arnndn: cannot open model"),
    });
    const suppressor = createFFmpegNoiseSuppressor({ spawn });
    await expect(
      suppressor.process({
        format: FORMAT,
        pcm: buildPcm(80),
      }),
    ).rejects.toThrow(/cannot open model/);
  });
});
