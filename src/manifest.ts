import { defineManifest, toolFactory } from "@absolutejs/manifest";
import { Type } from "@sinclair/typebox";
import type { MediaProcessorGraph } from "./index";
import {
  buildMediaResamplingPlan,
  renderMediaProcessorGraphMarkdown,
  summarizeMediaProcessorGraphReport,
} from "./index";

const tool = toolFactory<MediaProcessorGraph>();

const audioFormatSchema = (title: string) =>
  Type.Object(
    {
      channels: Type.Union([Type.Literal(1), Type.Literal(2)], {
        description: "Channel count: 1 (mono) or 2 (stereo).",
        title: "Channels",
      }),
      container: Type.Literal("raw", { title: "Container" }),
      encoding: Type.Union(
        [
          Type.Literal("alaw"),
          Type.Literal("mulaw"),
          Type.Literal("pcm_s16le"),
        ],
        {
          description:
            "Sample encoding: alaw / mulaw (telephony) or pcm_s16le.",
          title: "Encoding",
        },
      ),
      sampleRateHz: Type.Integer({
        description: "Sample rate in Hz, e.g. 8000, 16000, 48000.",
        minimum: 1,
        title: "Sample rate (Hz)",
      }),
    },
    { title },
  );

/* Media has no factory config: it is a library of realtime-media primitives
 * (frames, telephony serializers, transports, processor graphs, noise
 * suppression, quality/WebRTC reports, redaction). Tools run against the
 * app's live MediaProcessorGraph. */
export const manifest = defineManifest<
  Record<never, never>,
  MediaProcessorGraph
>()({
  contract: 2,
  identity: {
    accent: "#f43f5e",
    category: "media",
    description:
      "Realtime media primitives for voice and telephony apps: typed media frames, telephony stream (de)serializers, transports with backpressure, composable processor graphs (branch/fan-in, timing, lifecycle), noise suppression (energy gate, FFmpeg, Krisp-style frame processors), audio redaction, and quality / WebRTC-stats / calibration reports with markdown artifacts.",
    docsUrl: "https://github.com/absolutejs/media",
    name: "@absolutejs/media",
    tagline: "Clean, route, and monitor your app’s realtime audio.",
  },
  requires: {
    services: [
      {
        description:
          "ffmpeg binary on PATH — only needed for the FFmpeg noise suppressor",
        id: "ffmpeg",
        optional: true,
      },
    ],
  },
  settings: Type.Object({}),
  tools: {
    processor_graph_report: tool.runtime({
      annotations: { readOnlyHint: true },
      authorization: {
        approval: "never",
        audience: "admin",
        effects: ["read"],
        requiredScopes: ["media:inspect"],
      },
      description:
        'Health report for the live media processor graph: frames in/emitted/dropped, per-node errors, backpressure events, and issue codes. Use format "markdown" for the full rendered report.',
      handler: ({ format }, graph) => {
        const report = graph.report();

        return format === "markdown"
          ? renderMediaProcessorGraphMarkdown(report)
          : JSON.stringify(summarizeMediaProcessorGraphReport(report));
      },
      input: Type.Object({
        format: Type.Optional(
          Type.Union([Type.Literal("summary"), Type.Literal("markdown")], {
            description:
              "summary (compact JSON, default) or markdown (full report).",
          }),
        ),
      }),
    }),
    processor_graph_status: tool.runtime({
      annotations: { readOnlyHint: true },
      authorization: {
        approval: "never",
        audience: "admin",
        effects: ["read"],
        requiredScopes: ["media:inspect"],
      },
      description:
        "Current state of the live media processor graph (idle, running, draining, failed, or closed) and the names of its processor nodes.",
      handler: (_input, graph) =>
        JSON.stringify({
          nodes: graph.nodes.map((node) => node.name),
          state: graph.state(),
        }),
      input: Type.Object({}),
    }),
    resampling_plan: tool.runtime({
      annotations: { idempotentHint: true, readOnlyHint: true },
      authorization: {
        approval: "never",
        audience: "public",
        effects: ["read"],
      },
      description:
        "Check whether audio must be resampled or transcoded between two formats (e.g. 8 kHz mulaw telephony to 16 kHz PCM). Pure math — reports the ratio and a pass/warn status.",
      handler: ({ inputFormat, outputFormat }) =>
        JSON.stringify(buildMediaResamplingPlan({ inputFormat, outputFormat })),
      input: Type.Object({
        inputFormat: audioFormatSchema("Input format"),
        outputFormat: audioFormatSchema("Output format"),
      }),
    }),
  },
  wiring: [
    {
      description:
        "A processor graph pipes MediaFrames through your nodes (noise suppressors, redaction, custom transforms) with backpressure and per-node reporting. Feed it with graph.process(frame).",
      id: "default",
      server: {
        code: [
          "const mediaGraph = createMediaProcessorGraph({",
          "\tname: 'default',",
          "\tnodes: [",
          "\t\t// TODO: your processor nodes, e.g. a noise suppressor:",
          "\t\t// { name: 'gate', process: createEnergyGateNoiseSuppressor().process }",
          "\t]",
          "});",
        ].join("\n"),
        imports: [
          {
            from: "@absolutejs/media",
            names: ["createMediaProcessorGraph"],
          },
        ],
        placement: "module-scope",
      },
      title: "Create the media processor graph",
    },
  ],
});
