# AbsoluteJS Media Plan

Last researched: April 30, 2026

## North Star

Make `@absolutejs/media` the generic realtime media primitive layer for AbsoluteJS packages: frames, transports, processor graphs, calibration, quality reports, serializers, and browser/telephony media helpers that can power voice, video, avatars, meeting recorders, and future realtime products without forcing teams into Pipecat, LiveKit, or hosted media dashboards.

`@absolutejs/media` is not a voice-agent product. `@absolutejs/voice` consumes media reports and turns them into voice-specific readiness, provider, telephony, operations-record, and proof-pack evidence. Voice product work stays in `../voice/VOICE_PLAN.md`.

## Package Boundary

`@absolutejs/media` owns:

- Generic `MediaFrame` and audio format primitives.
- Transport lifecycle reports for browser, server, telephony, and provider streams.
- Ordered processor graphs with processor/filter/branch/sink nodes.
- Calibration, resampling, speech/VAD segment, and interruption reports.
- Future media quality reports: jitter, gaps, loss, drift, levels, continuity, and timing.
- Future WebRTC/WebSocket/browser helpers that are not voice-agent-specific.
- Future telephony media serializers when they can be generic across use cases.

`@absolutejs/voice` owns:

- Voice assistant/session/provider/telephony orchestration.
- `/voice/media-pipeline` routes, readiness assertions, and proof-pack integration.
- Voice traces, operations records, reviews, guardrails, handoffs, campaigns, and post-call workflows.
- Barge-in, turn ownership, provider contracts, and voice-specific deployment gates.

Future package splits are only justified if the surface becomes independently useful:

- `@absolutejs/webrtc` if ICE/signaling/session helpers become large and reusable outside media.
- `@absolutejs/realtime` if rooms, presence, fanout, pub/sub sessions, or reconnection semantics grow beyond media.
- `@absolutejs/telephony` if carrier setup/webhooks become a general telephony package instead of voice-agent support.

## Current Surface

Published package: `@absolutejs/media@0.0.1-beta.2`

Current primitives:

- `MediaFrame`, `MediaFrameKind`, `MediaFrameSource`
- `createMediaFrame(...)`
- `createMediaFrameTransformPipeline(...)`
- `createMediaProcessorGraph(...)`
- `buildMediaProcessorGraphReport(...)`
- `createMediaTransport(...)`
- `buildMediaTransportReport(...)`
- `buildMediaPipelineCalibrationReport(...)`
- `buildMediaResamplingPlan(...)`
- `buildMediaVadReport(...)`
- `buildMediaInterruptionReport(...)`
- `buildMediaQualityReport(...)`

Current proof consumption:

- `@absolutejs/voice@0.0.22-beta.316` consumes `@absolutejs/media@0.0.1-beta.2`.
- `absolutejs-voice-example` imports media primitives directly from `@absolutejs/media`.
- Latest voice proof pack passed at `.voice-runtime/proof-pack/2026-04-30T08-16-14.357Z` with 5 frames, 3 processor nodes, 5 processor output frames, 1 processor-dropped frame, connected transport, 0 backpressure events, and media quality status `pass` with 12ms jitter, 1.0 speech ratio, 520ms gap/drift within the demo budget, and no quality issues.

## Competitor Target: Pipecat Media Depth

Pipecat is strongest at pipeline shape: transport input/output, ordered frame processors, control/system frame semantics, WebRTC/WebSocket transport guidance, telephony serializers, service integrations, runners, SDKs, and debugger tooling.

AbsoluteJS should not bridge to Pipecat as the default path. The goal is to replace the parts AbsoluteJS apps need:

- TypeScript/Bun-native media primitives.
- Small composable APIs instead of a large Python runtime dependency.
- Reports that voice and future packages can convert into proof/readiness evidence.
- Browser, telephony, provider, and server media paths that can share the same vocabulary.

Research sources:

- Pipecat pipeline docs: https://docs.pipecat.ai/pipecat/learn/pipeline
- Pipecat transport docs: https://docs.pipecat.ai/pipecat/learn/transports
- Pipecat supported services: https://docs.pipecat.ai/server/services/supported-services
- Pipecat GitHub README: https://github.com/pipecat-ai/pipecat

## Priority 1: Media Quality Reports

Why this matters: a connected pipeline is not enough. Pipecat/WebRTC-style buyers care whether media is healthy under real timing, jitter, loss, drift, silence, and interruption conditions.

Status: shipped in `@absolutejs/media@0.0.1-beta.2`; voice consumes it in `@absolutejs/voice@0.0.22-beta.316`. Remaining work under this priority is deeper WebRTC loss/RTT stats and per-stream continuity detail, which belongs with Priority 3.

Deliverables:

- `buildMediaQualityReport(...)` for frames and optional transport events.
- Metrics:
- input frame count, output frame count, dropped/gap count
- jitter min/avg/p95/max where timestamps exist
- timestamp drift and clock skew hints
- silence ratio, speech ratio, and unknown ratio
- audio continuity gaps by stream/turn/session
- backpressure event count
- interruption stop latency inputs where available
- media level metadata summaries from RMS/energy/level fields
- Stable status/issue codes for quality gates.
- Voice consumption: `@absolutejs/voice` includes quality report data in `/voice/media-pipeline`, Markdown/HTML, and proof-pack assertions. Readiness-gate and operations-record rollups remain the next voice integration step.

Acceptance criteria:

- A voice app can fail proof when media has excessive gaps, jitter, drift, silence, or backpressure.
- The report is generic enough for meeting recorders and non-voice realtime apps.
- Voice can display quality issues without owning the quality calculation.

## Priority 2: Transport Helpers

Why this matters: Pipecat is strong because transports are first-class. AbsoluteJS needs clear browser/server transport primitives without hiding the runtime.

Deliverables:

- Browser WebSocket media transport helper.
- Server WebSocket media transport helper.
- Browser capture/playback metadata adapter that emits generic frame/timing events.
- Optional transport reconnect/resume report helpers.
- Backpressure and close/error propagation semantics.
- Voice consumption: voice should map transport reports into realtime-channel proof, media-pipeline proof, reconnect proof, and operations records.

Acceptance criteria:

- Apps can prove browser/server media flow without writing lifecycle bookkeeping.
- Transport helpers remain generic and do not depend on voice sessions, providers, or assistants.

## Priority 3: WebRTC Helpers

Why this matters: Pipecat docs correctly position WebRTC as the better browser/mobile realtime transport for latency, packet loss, audio processing, stats, timestamping, and reconnection.

Deliverables:

- Generic WebRTC session stats normalization.
- ICE/signaling-agnostic media report helpers.
- WebRTC inbound/outbound frame timing reports.
- Packet loss, jitter, RTT, bytes, and track-state summaries from browser stats.
- Optional adapter seam for signaling implementations instead of owning a signaling platform too early.
- Voice consumption: voice should use WebRTC reports for browser voice proof and eventually phone/web bridge proof.

Acceptance criteria:

- A browser app can produce a useful media quality report from WebRTC stats.
- The API does not force a hosted signaling service or voice-agent abstraction.

## Priority 4: Telephony Media Serializers

Why this matters: Twilio/Telnyx/Plivo/Vonage media streams use carrier-specific event envelopes but the media serialization problem is generic.

Deliverables:

- Generic serializer interface for external media stream envelopes.
- Twilio media stream parser/serializer.
- Telnyx media stream parser/serializer.
- Plivo media stream parser/serializer.
- Vonage/Exotel roadmap placeholders only if docs and demand justify them.
- Codec/sample-rate metadata normalization.
- Voice consumption: `@absolutejs/voice` should use serializers in phone-agent media proof, carrier setup proof, and telephony operations records.

Acceptance criteria:

- Carrier-specific stream packets become generic `MediaFrame`/transport events.
- Voice telephony code no longer needs carrier media parsing logic outside media adapters.

## Priority 5: Processor Graph Lifecycle

Why this matters: current processor graphs prove ordered filter/branch/processor behavior. Pipecat-depth apps also need lifecycle, error, drain, and branch observability.

Deliverables:

- Graph lifecycle states: idle, running, draining, closed, failed.
- Node error propagation and per-node failure status.
- Drain/flush support for buffered processors.
- Optional branch labels and edge reports.
- Graph-level event stream for debugging.
- Voice consumption: voice should link graph failures to operations records and readiness gates.

Acceptance criteria:

- A failed processor node can produce actionable report evidence.
- Long-running media graphs can be stopped/drained without losing final reports.

## Priority 6: Debug And Artifact Helpers

Why this matters: Pipecat has debugger/observability tooling. AbsoluteJS should answer with file-based, code-owned media artifacts that product packages can expose.

Deliverables:

- JSON artifact writer for media quality/transport/graph reports.
- Markdown renderer for generic media reports.
- Optional compact timeline renderer for media events.
- Redaction/metadata filtering hooks.
- Voice consumption: voice proof packs should include media artifacts as part of release evidence.

Acceptance criteria:

- A developer can inspect a media failure without a hosted dashboard.
- Artifacts are generic enough for voice and non-voice examples.

## Integration Contract With Voice

`@absolutejs/media` should expose report objects; `@absolutejs/voice` should decide how those reports affect voice readiness.

Media should not know about:

- Assistants
- Providers
- Operations records
- Campaigns
- Reviews
- Guardrails
- Voice routes
- Production-readiness gates

Voice should consume:

- `MediaPipelineCalibrationReport`
- `MediaProcessorGraphReport`
- `MediaTransportReport`
- Future `MediaQualityReport`
- Future WebRTC stats reports
- Future telephony serializer reports

This keeps media reusable while giving voice the product-level proof needed to beat Vapi, Retell, Bland, LiveKit Agents, and Pipecat for self-hosted AbsoluteJS buyers.
