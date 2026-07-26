import { describe, expect, test } from "bun:test";
import { mkdtemp, readFile, rm } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import {
  buildMediaProcessorGraphArtifact,
  buildMediaQualityArtifact,
  buildMediaTransportArtifact,
  createMediaFrame,
  createMediaProcessorGraph,
  createMediaTransport,
  buildMediaQualityReport,
  redactMediaReport,
  renderMediaProcessorGraphMarkdown,
  renderMediaQualityMarkdown,
  renderMediaTransportMarkdown,
  summarizeMediaProcessorGraphReport,
  summarizeMediaQualityReport,
  summarizeMediaTransportReport,
  writeMediaArtifact,
} from "../src";

const raw24k = {
  channels: 1,
  container: "raw",
  encoding: "pcm_s16le",
  sampleRateHz: 24_000,
} as const;

const goodFrames = [
  createMediaFrame({
    at: 0,
    durationMs: 20,
    format: raw24k,
    id: "input-1",
    kind: "input-audio",
    metadata: { level: 0.4, speechProbability: 0.9 },
    source: "browser",
  }),
  createMediaFrame({
    at: 20,
    durationMs: 20,
    format: raw24k,
    id: "input-2",
    kind: "input-audio",
    metadata: { level: 0.42, speechProbability: 0.9 },
    source: "browser",
  }),
  createMediaFrame({
    at: 40,
    durationMs: 20,
    format: raw24k,
    id: "assistant-1",
    kind: "assistant-audio",
    metadata: { jitterMs: 4, level: 0.48 },
    source: "provider",
  }),
];

describe("media quality artifact", () => {
  test("summarizes healthy frames into a compact object", () => {
    const report = buildMediaQualityReport({
      frames: goodFrames,
      maxGapMs: 5,
      maxJitterMs: 20,
      maxTimestampDriftMs: 5,
      minSpeechRatio: 0.5,
    });
    const summary = summarizeMediaQualityReport(report);
    expect(summary.status).toBe("pass");
    expect(summary.frameCount).toBe(report.totalFrames);
    expect(summary.issueCount).toBe(0);
    expect(summary.issueCodes).toEqual([]);
    expect(summary.description).toContain("frame(s)");
  });

  test("flags excessive jitter with a stable issue code", () => {
    const jittery = [
      createMediaFrame({
        at: 0,
        durationMs: 20,
        format: raw24k,
        id: "input-1",
        kind: "input-audio",
        metadata: { jitterMs: 80, level: 0.4, speechProbability: 0.9 },
        source: "browser",
      }),
      createMediaFrame({
        at: 200,
        durationMs: 20,
        format: raw24k,
        id: "assistant-1",
        kind: "assistant-audio",
        metadata: { jitterMs: 80, level: 0.4 },
        source: "provider",
      }),
    ];
    const report = buildMediaQualityReport({
      frames: jittery,
      maxGapMs: 50,
      maxJitterMs: 20,
      maxTimestampDriftMs: 50,
      minSpeechRatio: 0.5,
    });
    const summary = summarizeMediaQualityReport(report);
    expect(summary.status).not.toBe("pass");
    expect(summary.issueCodes).toContain("media.quality_jitter");
    const markdown = renderMediaQualityMarkdown(report);
    expect(markdown).toContain("Status: **");
    expect(markdown).toContain("| Jitter |");
    expect(markdown).toContain("media.quality_jitter");
  });

  test("bundles JSON, Markdown, and summary into an artifact pair", () => {
    const report = buildMediaQualityReport({
      frames: goodFrames,
      maxJitterMs: 50,
      maxTimestampDriftMs: 50,
      minSpeechRatio: 0.5,
    });
    const artifact = buildMediaQualityArtifact(report);
    expect(artifact.summary.status).toBe(report.status);
    expect(typeof artifact.json).toBe("string");
    expect(artifact.markdown.startsWith("# Media Quality Report")).toBe(true);
    expect(artifact.jsonValue).toEqual(report);
  });
});

describe("media transport artifact", () => {
  test("summarizes a connected transport", async () => {
    const transport = createMediaTransport({
      inputFormat: raw24k,
      maxBufferedFrames: 8,
      name: "unit-transport",
      outputFormat: raw24k,
    });
    await transport.connect?.();
    for (const frame of goodFrames) {
      if (frame.kind === "input-audio") {
        await transport.receive(frame);
      } else if (frame.kind === "assistant-audio") {
        await transport.send(frame);
      }
    }
    const report = transport.report();
    const summary = summarizeMediaTransportReport(report);
    expect(summary.name).toBe("unit-transport");
    expect(summary.state).toBe("open");
    expect(summary.inputFrames).toBeGreaterThanOrEqual(2);
    expect(summary.outputFrames).toBeGreaterThanOrEqual(1);
    const markdown = renderMediaTransportMarkdown(report);
    expect(markdown).toContain("Media Transport: unit-transport");
    expect(markdown).toContain("| Input frames |");
    const artifact = buildMediaTransportArtifact(report);
    expect(artifact.summary).toEqual(summary);
  });
});

describe("media processor graph artifact", () => {
  test("summarizes a healthy graph and tolerates many lifecycle events", async () => {
    const frames = Array.from({ length: 12 }, (_, index) =>
      createMediaFrame({
        at: index * 20,
        durationMs: 20,
        format: raw24k,
        id: `input-${String(index)}`,
        kind: "input-audio",
        metadata: { speechProbability: 0.9 },
        source: "browser",
      }),
    );
    const graph = createMediaProcessorGraph({
      name: "unit-graph",
      nodes: [
        {
          kind: "filter",
          name: "gate",
          process: (frame) => frame.kind === "input-audio",
        },
        {
          kind: "processor",
          name: "tag",
          process: (frame) => ({
            ...frame,
            metadata: { ...frame.metadata, tagged: true },
          }),
        },
      ],
    });
    await graph.processMany(frames);
    const report = graph.report();
    const summary = summarizeMediaProcessorGraphReport(report);
    expect(summary.nodeCount).toBe(2);
    expect(summary.inputFrames).toBe(frames.length);
    expect(summary.status).toBe("pass");
    const artifact = buildMediaProcessorGraphArtifact(report, {
      redact: { truncateArraysAt: 3 },
    });
    expect(artifact.markdown).toContain("Media Processor Graph: unit-graph");
    expect(artifact.markdown).toContain("| Nodes |");
    expect(artifact.markdown).toContain("## Edges (showing up to 3)");
    const parsed = JSON.parse(artifact.json) as {
      lifecycleEvents: readonly unknown[];
    };
    expect(parsed.lifecycleEvents.length).toBeLessThanOrEqual(4);
  });

  test("renders graph errors as issue rows", () => {
    const report = {
      backpressure: {
        completedFrames: 0,
        droppedFrames: 0,
        events: [],
        maxInFlightFrames: 1,
        maxObservedInFlight: 0,
        maxObservedQueued: 0,
        maxQueuedFrames: 1,
        queuedFrames: 0,
        rejectedFrames: 0,
        status: "pass",
      },
      backpressureEvents: [],
      checkedAt: Date.now(),
      droppedFrames: 0,
      edges: [],
      emittedFrames: 0,
      edgeEvents: [],
      errors: [
        {
          at: 0,
          error: 'Node "tag" threw RangeError',
          kind: "node-error" as const,
          node: "tag",
          state: "failed" as const,
        },
      ],
      events: [],
      inputFrames: 0,
      lifecycleEvents: [],
      name: "broken-graph",
      nodes: [],
      state: "failed" as const,
      status: "fail" as const,
      timing: {
        averageNodeMs: 0,
        events: [],
        maxNodeMs: 0,
        maxNodeProcessingMs: 0,
        nodes: [],
        overBudgetFrames: 0,
        status: "pass" as const,
        totalNodeMs: 0,
      },
      timingEvents: [],
    };
    const summary = summarizeMediaProcessorGraphReport(report);
    expect(summary.issueCodes).toContain("node-error");
    expect(summary.errorCount).toBe(1);
    const markdown = renderMediaProcessorGraphMarkdown(report);
    expect(markdown).toContain("node-error");
    expect(markdown).toContain('Node "tag" threw RangeError');
  });
});

describe("media artifact redaction and writer", () => {
  test("strips denied metadata keys and truncates arrays", () => {
    const value = {
      events: Array.from({ length: 12 }, (_, i) => ({
        at: i,
        frameId: `f-${String(i)}`,
      })),
      metadata: { phone: "+1-555-0100", traceId: "t-1" },
      transcript: "hello world",
    };
    const redacted = redactMediaReport(value, {
      truncateArraysAt: 3,
    });
    const cast = redacted as typeof value & {
      events: readonly unknown[];
    };
    expect(cast.events.length).toBe(4); // 3 + truncation marker
    expect(cast.transcript).toBeUndefined();
    const masked = redactMediaReport(value, {
      mode: "mask",
      truncateArraysAt: 100,
    }) as { metadata: { phone: string }; transcript: string };
    expect(masked.metadata.phone).toBe("[redacted]");
    expect(masked.transcript).toBe("[redacted]");
  });

  test("writeMediaArtifact persists JSON and Markdown together", async () => {
    const dir = await mkdtemp(join(tmpdir(), "media-artifact-"));
    try {
      const report = buildMediaQualityReport({
        frames: goodFrames,
        maxJitterMs: 50,
        maxTimestampDriftMs: 50,
        minSpeechRatio: 0.5,
      });
      const artifact = buildMediaQualityArtifact(report);
      const result = await writeMediaArtifact({
        dir,
        slug: "quality",
        ...artifact,
      });
      expect(result.jsonPath.endsWith("quality.json")).toBe(true);
      expect(result.markdownPath.endsWith("quality.md")).toBe(true);
      const json = await readFile(result.jsonPath, "utf8");
      const md = await readFile(result.markdownPath, "utf8");
      expect(json).toContain('"status"');
      expect(md).toContain("Media Quality Report");
    } finally {
      await rm(dir, { recursive: true, force: true });
    }
  });
});
