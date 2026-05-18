# AbsoluteJS Media Pickup

Use this when starting the next session:

```text
We are continuing AbsoluteJS Media from /home/alexkahn/abs/media. First read MEDIA_PLAN.md and PICKUP.md, then check git status. The next recommended work is generic media artifact readability: add compact Markdown/artifact helpers for media quality, transport, and processor graph reports. Keep @absolutejs/media generic and reusable; do not add voice assistants, providers, readiness gates, operations records, campaigns, or voice routes here. Voice consumes media reports from /home/alexkahn/abs/voice and turns them into buyer-facing proof, readiness, incident, and operations surfaces. After media changes, run media tests/build, publish a beta if needed, install it into voice/example with --force, then run the relevant voice proof.
```

## Current State

- Media repo: `/home/alexkahn/abs/media`
- Current package: `@absolutejs/media@0.0.1-beta.16`
- Latest pushed media commit: `527840a Make writeMediaArtifact lazy-load node:fs to keep browser bundles parseable`
- Voice consumer: `/home/alexkahn/abs/voice` (now externalizes `@absolutejs/media`, see voice@0.0.22-beta.465)
- Real example consumer: `/home/alexkahn/alex/absolutejs-voice-example`
- Latest voice proof consuming media passed at `.voice-runtime/proof-pack/runtime/2026-05-18T23-42-25.003Z/proof-pack/latest.json` with mediaPipelineCalibrationAssertion summary at ~1.7 KB (down from ~35 KB) and per-report media artifacts persisted alongside.
- New public API: `summarizeMedia{Quality,Transport,ProcessorGraph}Report`, `renderMedia{Quality,Transport,ProcessorGraph}Markdown`, `buildMedia{Quality,Transport,ProcessorGraph}Artifact`, `writeMediaArtifact`, `redactMediaReport`.
- `writeMediaArtifact` lazy-imports `node:fs/promises`/`node:path` so the function can ship in browser bundles without breaking parse. Server callers see no behavioral change.

## Boundary

Media owns generic realtime media primitives:

- Media frames and frame transforms.
- Transport lifecycle reports.
- Processor graphs, branch/fan-in helpers, lifecycle events, timing, backpressure, and snapshots.
- Media quality reports.
- WebRTC stats and continuity reports.
- Telephony stream packet parsing, serialization, and generic lifecycle reports.
- Generic media artifact writers/renderers.

Media should not know about:

- Voice assistants, providers, sessions, operations records, campaigns, guardrails, handoffs, production-readiness gates, proof-pack policy, or framework voice bindings.

Those belong in `/home/alexkahn/abs/voice`.

## Next Recommended Work

Start with compact artifact helpers:

- Add `renderMediaQualityMarkdown(...)` or equivalent compact renderer.
- Add `renderMediaTransportMarkdown(...)` or equivalent compact renderer.
- Add `renderMediaProcessorGraphMarkdown(...)` or equivalent compact renderer.
- Add artifact writer helpers that can persist JSON plus Markdown together.
- Add redaction/metadata filtering hooks for noisy reports.
- Add tests with intentionally bad jitter, drift, silence, backpressure, graph failure, and telephony lifecycle issues.

The goal is that voice proof packs can link to readable media artifacts instead of dumping huge raw realtime-channel internals.

## Combined Voice Work

After media artifact helpers exist, `@absolutejs/voice` should:

- Include compact media artifacts in proof packs.
- Map media issue codes to production-readiness checks.
- Link media artifacts from operations records and incident timelines.
- Prefer real browser/telephony media evidence before deterministic proof envelopes.

## Verification Expectations

For media-only changes:

```sh
bun test
bun run typecheck
bun run build
```

If publishing a new media beta:

- Publish from `/home/alexkahn/abs/media`.
- Install into `/home/alexkahn/abs/voice` and `/home/alexkahn/alex/absolutejs-voice-example` with `--force`.
- Run relevant voice tests/proof after voice consumption changes.
- Commit and push all touched repos.
