# AbsoluteJS Media

`@absolutejs/media` provides low-level realtime media primitives for AbsoluteJS packages.

It owns generic media frame, transport, processor graph, calibration, resampling, speech activity, and interruption reports. Product-specific voice routes, readiness gates, provider orchestration, operations records, and proof-pack integrations stay in `@absolutejs/voice`.

## Installation

```sh
bun add @absolutejs/media
```

## Media frames

```ts
import { createMediaFrame } from '@absolutejs/media';

const pcmBytes = new Uint8Array(320);
const frame = createMediaFrame({
	at: Date.now(),
	audio: pcmBytes,
	durationMs: 20,
	id: 'frame-1',
	kind: 'input-audio',
	source: 'browser'
});
```

Use transports and processor graphs to move and transform frames, then build calibration, VAD, interruption, quality, WebRTC, and continuity reports at the boundaries your application operates.

See `MEDIA_PLAN.md` for the media runtime roadmap. Voice-specific product needs live in `../voice/VOICE_PLAN.md`.

## What's new

### 0.0.1-beta.16

- `writeMediaArtifact` lazy-imports `node:fs/promises`/`node:path` so the function can ship in browser bundles without breaking parse. Server callers see no behavioral change.

### 0.0.1-beta.15

Compact artifact helpers for product packages that want to inspect media health without a hosted dashboard.

- Compact summary types and helpers: `summarizeMediaQualityReport(...)`, `summarizeMediaTransportReport(...)`, `summarizeMediaProcessorGraphReport(...)` produce array-free, stable-shape summaries with `issueCodes` you can gate on.
- Markdown renderers: `renderMediaQualityMarkdown(...)`, `renderMediaTransportMarkdown(...)`, `renderMediaProcessorGraphMarkdown(...)` emit compact human-readable artifacts.
- Artifact bundles: `buildMediaQualityArtifact(...)`, `buildMediaTransportArtifact(...)`, `buildMediaProcessorGraphArtifact(...)` return `{ json, jsonValue, markdown, summary }` for a single call.
- Writer: `writeMediaArtifact({ dir, slug, json, markdown, summary })` persists `<slug>.json` + `<slug>.md` side by side.
- Redaction: `redactMediaReport(report, { mode, metadataAllow, metadataDeny, truncateArraysAt })` strips or masks noisy metadata before persisting.

Consumed by `@absolutejs/voice@0.0.22-beta.464+` to shrink the voice proof-pack `mediaPipelineCalibrationAssertion` summary from ~35 KB to ~1.7 KB and to link readable per-report artifacts (`media-quality.{json,md}`, `media-transport.{json,md}`, `media-processor-graph.{json,md}`) instead of inlining raw realtime-channel internals.
